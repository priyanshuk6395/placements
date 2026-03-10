import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';
import * as XLSX from 'xlsx';

async function fetchAndPersistLogo(domain: string) {
  const apiUrl = `https://img.logo.dev/${domain}?token=${process.env.LOGODEV_API_KEY}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const bulkOps = [];
    const warnings: string[] = []; 
    let totalProcessed = 0;

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
            // Check for Excel Serial (e.g., 45882). Matches exactly 5 digits.
            const serialMatch = rawDateVal.match(/^\d{5}$/);
            if (serialMatch) {
              const dateObj = new Date((parseInt(serialMatch[0]) - 25569) * 86400 * 1000);
              const d = String(dateObj.getDate()).padStart(2, '0');
              const m = String(dateObj.getMonth() + 1).padStart(2, '0');
              const y = dateObj.getFullYear();
              finalDate = `${d}-${m}-${y}`;
            } else {
              // Handle standard formats or slashed dates
              finalDate = rawDateVal.replace(/\//g, '-').replace(/[^0-9-]/g, '');
            }
          } catch (e) {
            finalDate = "Invalid Date";
          }
        }

        // --- VALIDATION CHECKPOINT ---
        if (companyName === "Unknown") warnings.push(`Missing Company for ID: ${enrollmentNo}`);
        if (ctcValue === 0 && stipendValue === 0) warnings.push(`Compensation is 0 or invalid for ID: ${enrollmentNo}`);

        // Website/Domain Logic
        let domain = getRawVal("Website").toLowerCase();
        if (!domain && companyName !== "Unknown") {
          domain = companyName.replace(/\(.*\)/g, '').replace(/Intern|\+PPO/gi, '').trim().toLowerCase().split(' ')[0] + ".com";
        }

        const existingLogo = domain ? await Placement.findOne({ website: domain, logoData: { $ne: null } }) : null;
        const logoData = existingLogo ? existingLogo.logoData : (domain ? await fetchAndPersistLogo(domain) : null);
        
        bulkOps.push({
          updateOne: {
            filter: { enrollmentNo, company: companyName, offerType: offerType },
            update: {
              $set: {
                name: (names[i] || names[0] || "N/A").trim(),
                gender: (genders[i] || genders[0] || "Male").trim(),
                branch: finalBranch,
                company: companyName,
                offerType: offerType, 
                website: domain || "N/A",
                ctc: ctcValue,
                stipend: stipendValue,
                date: finalDate, // Now strictly sanitized
                linkedin: getRawVal("Linkdein").trim(),
                logoData: logoData
              }
            },
            upsert: true,
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      const result = await Placement.bulkWrite(bulkOps);
      return NextResponse.json({ 
        success: true, 
        status: warnings.length === 0 ? "Perfect" : "Partial",
        processed: totalProcessed,
        modified: result.upsertedCount + result.modifiedCount,
        warnings: warnings
      });
    }

    return NextResponse.json({ success: false, error: "No valid data found." }, { status: 400 });

  } catch (error) {
    console.error("Critical Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}