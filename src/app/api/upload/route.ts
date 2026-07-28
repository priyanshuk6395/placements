import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { fileUploadSchema } from '@/lib/validation';
import Placement from '@/models/Placement';
import * as XLSX from 'xlsx';

// SECURITY FIX: Concurrent logo fetches with rate limiting
const MAX_CONCURRENT_FETCHES = 3;
let currentFetches = 0;

async function fetchAndPersistLogo(domain: string): Promise<string | null> {
  // Wait if we're at max concurrency
  while (currentFetches >= MAX_CONCURRENT_FETCHES) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  currentFetches++;

  try {
    const apiUrl = `https://img.logo.dev/${domain}?token=${process.env.LOGODEV_API_KEY}`;
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Logo fetch failed for ${domain}:`, error);
    return null;
  } finally {
    currentFetches--;
  }
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX: Require authentication
    const session = await requireAuth();
    if (!session) {
      return unauthorizedResponse("You must be logged in to upload data");
    }

    await dbConnect();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const batchString = formData.get('batch') as string;
    const previewOnly = formData.get('previewOnly') === 'true';

    // SECURITY FIX: Validate batch format
    try {
      fileUploadSchema.parse({ batch: batchString });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: "Invalid batch format. Use format: YYYY-YYYY" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const batchYear = parseInt(batchString.split('-')[1]);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const bulkOps = [];
    const warnings: string[] = [];
    let totalProcessed = 0;

    // SECURITY FIX: Collect all logo fetch promises for parallel execution
    const logoFetchPromises = new Map<string, Promise<string | null>>();

    for (const row of rawData as any[]) {
      const getRawVal = (key1: string, key2?: string) => {
        const foundKey = Object.keys(row).find(k =>
          k.trim().toLowerCase().includes(key1.toLowerCase()) ||
          (key2 && k.trim().toLowerCase().includes(key2.toLowerCase()))
        );
        return foundKey ? String(row[foundKey]) : "";
      };

      const ids = getRawVal("Enrollment Number").split('\n').filter(Boolean);
      const names = getRawVal("Name").split('\n').filter(Boolean);
      const genders = getRawVal("Gender").split('\n').filter(Boolean);

      const rawBranchString = getRawVal("Branch");
      const branches = rawBranchString.split('\n').filter(Boolean);
      const companies = getRawVal("Company").split('\n').filter(Boolean);
      const ctcs = getRawVal("CTC", "Compensation").split('\n').filter(Boolean);
      const dates = getRawVal("Date").split('\n').filter(Boolean);
      const offerTypes = getRawVal("Offer Type", "Offer").split('\n').filter(Boolean);

      for (let i = 0; i < ids.length; i++) {
        const enrollmentNo = ids[i].trim();
        totalProcessed++;

        let companyName = (companies[i] || companies[0] || "").trim();
        let offerType = (offerTypes[i] || offerTypes[0] || "Full-Time").trim();

        // --- DATA SALVAGE LOGIC ---
        if (!companyName || companyName === "N/A") {
          const potentialCompany = branches[i + 1] || branches[i];
          if (potentialCompany && !potentialCompany.toLowerCase().includes('bachelor')) {
            companyName = potentialCompany.trim();
          } else {
            companyName = "Unknown";
          }
        }

        // --- INTELLIGENT BRANCH SENSING ---
        const rawBranch = branches[i] || branches[0] || "";
        const lowerBranch = rawBranch.toLowerCase();
        let finalBranch = "Unknown";
        if (lowerBranch.includes('computer science')) finalBranch = 'CSE';
        else if (lowerBranch.includes('information technology')) finalBranch = 'IT';
        else if (lowerBranch.includes('electronics')) finalBranch = 'ECE';
        else {
          const match = rawBranch.match(/\(([^)]+)\)/);
          finalBranch = match ? match[1].trim() : rawBranch.replace(/Bachelor of Technology/gi, 'B.Tech').trim();
        }

        // --- SMART COMPENSATION SPLITTER ---
        let rawCompStr = (ctcs[i] || ctcs[0] || '0').toLowerCase().replace(/\s/g, '');
        let ctcValue = 0;
        let stipendValue = 0;
        if (rawCompStr.includes('k')) {
          stipendValue = parseFloat(rawCompStr) * 1000;
        } else {
          let parsed = parseFloat(rawCompStr.replace(/[^0-9.]/g, '')) || 0;
          if (parsed > 1000) {
            stipendValue = parsed;
          } else {
            ctcValue = Number(parsed.toFixed(2));
          }
        }

        // --- BULLETPROOF DATE SANITIZER (EXCEL SERIAL FIX) ---
        const rawDateVal = (dates[i] || dates[0] || "").trim();
        let finalDate = "TBD";
        if (rawDateVal) {
          try {
            const serialMatch = rawDateVal.match(/^\d{5}$/);
            if (serialMatch) {
              const dateObj = new Date((parseInt(serialMatch[0]) - 25569) * 86400 * 1000);
              const d = String(dateObj.getDate()).padStart(2, '0');
              const m = String(dateObj.getMonth() + 1).padStart(2, '0');
              const y = dateObj.getFullYear();
              finalDate = `${d}-${m}-${y}`;
            } else {
              finalDate = rawDateVal.replace(/\//g, '-').replace(/[^0-9-]/g, '');
            }
          } catch (e) {
            finalDate = "Invalid Date";
          }
        }

        // --- VALIDATION CHECKPOINT ---
        if (companyName === "Unknown") warnings.push(`Row ${i}: Missing Company for ID: ${enrollmentNo}`);
        if (ctcValue === 0 && stipendValue === 0) warnings.push(`Row ${i}: Compensation is 0 or invalid for ID: ${enrollmentNo}`);

        // Website/Domain Logic
        let domain = getRawVal("Website").toLowerCase();
        if (!domain && companyName !== "Unknown") {
          domain = companyName
            .replace(/\(.*\)/g, '')
            .replace(/Intern|\+PPO/gi, '')
            .trim()
            .toLowerCase()
            .split(' ')[0]
            .substring(0, 50) // SECURITY: Limit length
            + ".com";
        }

        // SECURITY FIX: Schedule logo fetch only once per domain
        let logoData = null;
        if (domain && !previewOnly) {
          if (!logoFetchPromises.has(domain)) {
            // Start fetch if not already scheduled
            logoFetchPromises.set(domain, fetchAndPersistLogo(domain));
          }
          // Note: We'll await all fetches later
        }

        bulkOps.push({
          updateOne: {
            filter: { enrollmentNo, company: companyName, offerType: offerType },
            update: {
              $set: {
                name: (names[i] || names[0] || "N/A").trim().substring(0, 255),
                gender: (genders[i] || genders[0] || "Male").trim(),
                branch: finalBranch,
                company: companyName.substring(0, 255),
                offerType: offerType.substring(0, 100),
                website: domain || "N/A",
                ctc: ctcValue,
                stipend: stipendValue,
                date: finalDate,
                linkedin: getRawVal("Linkdein").trim(),
                logoData: null, // Will be set after parallel fetches
                batchYear
              }
            },
            upsert: true,
          }
        });
      }
    }

    if (bulkOps.length === 0) {
      return NextResponse.json({ success: false, error: "No valid data found." }, { status: 400 });
    }

    // Build a pre-commit summary of which records will be inserted vs updated.
    const uniqueFilters = new Map<string, { enrollmentNo: string; company: string; offerType: string }>();
    for (const op of bulkOps as any[]) {
      const filter = op.updateOne.filter as { enrollmentNo: string; company: string; offerType: string };
      const key = `${filter.enrollmentNo}||${filter.company}||${filter.offerType}`;
      if (!uniqueFilters.has(key)) {
        uniqueFilters.set(key, filter);
      }
    }

    const existingRecords = await Placement.find(
      { $or: Array.from(uniqueFilters.values()) },
      { enrollmentNo: 1, company: 1, offerType: 1, _id: 0 },
    ).lean();

    const existingKeys = new Set(
      existingRecords.map(
        (doc: any) => `${doc.enrollmentNo}||${doc.company}||${doc.offerType}`,
      ),
    );

    let willUpdate = 0;
    let willInsert = 0;
    for (const key of uniqueFilters.keys()) {
      if (existingKeys.has(key)) willUpdate += 1;
      else willInsert += 1;
    }

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        processed: totalProcessed,
        totalCandidates: bulkOps.length,
        uniqueCandidates: uniqueFilters.size,
        willInsert,
        willUpdate,
        warnings,
      });
    }

    // SECURITY FIX: Await all logo fetches in parallel
    const logoDataMap = new Map<string, string | null>();
    for (const [domain, fetchPromise] of logoFetchPromises) {
      logoDataMap.set(domain, await fetchPromise);
    }

    // Update bulkOps with fetched logos
    for (const op of bulkOps) {
      const domain = (op.updateOne.update.$set as any).website;
      if (domain && domain !== "N/A" && logoDataMap.has(domain)) {
        (op.updateOne.update.$set as any).logoData = logoDataMap.get(domain);
      }
    }

    const result = await Placement.bulkWrite(bulkOps);
    return NextResponse.json({
      success: true,
      status: warnings.length === 0 ? "Perfect" : "Partial",
      processed: totalProcessed,
      modified: result.upsertedCount + result.modifiedCount,
      willInsert,
      willUpdate,
      warnings: warnings
    });

  } catch (error: any) {
    console.error("Critical Upload Error:", error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: "Upload failed. Please try again." }, { status: 500 });
  }
}