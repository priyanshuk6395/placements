import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';

// Reuse the logo fetching logic
async function fetchAndPersistLogo(domain: string) {
  const apiUrl = `https://img.logo.dev/${domain}?token=${process.env.LOGODEV_API_KEY}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Logo fetch failed:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // 1. Determine the domain/website for logo lookup
    let domain = body.website ? body.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] : "";
    
    // If no explicit website, try to derive from company name
    if (!domain && body.company) {
      domain = body.company.replace(/\s+/g, '').toLowerCase() + ".com";
    }

    let logoData = null;

    if (domain) {
      // 2. Check if we already have this logo saved in another record
      const existingLogo = await Placement.findOne({ 
        website: { $regex: new RegExp(domain, 'i') }, 
        logoData: { $ne: null } 
      });

      if (existingLogo) {
        logoData = existingLogo.logoData;
      } else {
        // 3. Fetch fresh logo if not found
        logoData = await fetchAndPersistLogo(domain);
      }
    }

    // 4. Create new record with the fetched/existing logo
    const newPlacement = await Placement.create({
      ...body,
      website: domain || body.website,
      logoData
    });
    
    return NextResponse.json({ success: true, data: newPlacement });
  } catch (error) {
    console.error("Placement save error:", error);
    return NextResponse.json({ success: false, error: "Failed to save entry" }, { status: 400 });
  }
}