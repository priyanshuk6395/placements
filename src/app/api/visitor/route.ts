import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Visitor from '@/models/Visitor';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { ip, name } = await req.json();

    // Use upsert to update the name if the IP already exists
    await Visitor.updateOne(
      { ip },
      { $set: { name, createdAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save identity" }, { status: 400 });
  }
}