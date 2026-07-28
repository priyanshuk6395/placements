import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { placementSchema } from '@/lib/validation';
import Placement from '@/models/Placement';

// Parallel logo fetch with concurrency limit
const MAX_CONCURRENT_FETCHES = 3;
let currentFetches = 0;
const fetchQueue: Array<{ resolve: (value: string | null) => void; domain: string }> = [];

async function fetchAndPersistLogo(domain: string): Promise<string | null> {
  // Wait if we're at max concurrency
  while (currentFetches >= MAX_CONCURRENT_FETCHES) {
    await new Promise(resolve => setTimeout(resolve, 100));
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

export async function POST(req: Request) {
  try {
    // SECURITY FIX: Require authentication
    const session = await requireAuth();
    if (!session) {
      return unauthorizedResponse("You must be logged in to create placements");
    }

    await dbConnect();
    const body = await req.json();

    // SECURITY FIX: Validate input with zod
    const validated = placementSchema.parse(body);

    // Determine the domain/website for logo lookup
    let domain = validated.website
      ? validated.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
      : "";

    // If no explicit website, derive from company name (with sanitization)
    if (!domain && validated.company) {
      domain = validated.company
        .replace(/\s+/g, '')
        .toLowerCase()
        .substring(0, 50) // Limit length
        + ".com";
    }

    let logoData = null;

    if (domain) {
      // Check if we already have this logo saved in another record
      const existingLogo = await Placement.findOne({
        website: { $regex: new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        logoData: { $ne: null }
      });

      if (existingLogo) {
        logoData = existingLogo.logoData;
      } else {
        // Fetch fresh logo if not found
        logoData = await fetchAndPersistLogo(domain);
      }
    }

    // Create new record with fetched/existing logo
    const newPlacement = await Placement.create({
      ...validated,
      website: domain || validated.website || "N/A",
      logoData
    });

    return NextResponse.json({ success: true, data: newPlacement });
  } catch (error: any) {
    console.error("Placement save error:", error);
    
    // Return validation errors with details
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: "Failed to save entry" }, { status: 400 });
  }
}