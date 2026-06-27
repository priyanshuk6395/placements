import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await dbConnect();
    const allPlacements = await Placement.find({}).lean();

    const workbook = XLSX.utils.book_new();

    // Grouping by batch
    const groups: Record<number, any[]> = {};
    allPlacements.forEach((p) => {
      const year = p.batchYear || 0;
      if (!groups[year]) groups[year] = [];
      
      // Explicit Order: Map keys in your preferred order and exclude logoData
      groups[year].push({
        "Name": p.name,
        "Enrollment Number": p.enrollmentNo,
        "Gender": p.gender,
        "Branch": p.branch,
        "Company": p.company,
        "Offer Type": p.offerType,
        "CTC (LPA)": (p.ctc === 0 || !p.ctc) ? `${p.stipend} per M` : p.ctc,
        "Website": p.website,
        "Date": p.date,
        "LinkedIn": p.linkedin
      });
    });

    Object.keys(groups).sort().forEach((year) => {
      const worksheet = XLSX.utils.json_to_sheet(groups[Number(year)]);
      XLSX.utils.book_append_sheet(workbook, worksheet, `${year} Batch`);
    });

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': 'attachment; filename="All_Placements.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}