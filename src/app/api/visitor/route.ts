import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';
import { visitorSchema } from '@/lib/validation';
import Visitor from '@/models/Visitor';

export async function POST(req: NextRequest) {
  try {
    // SECURITY FIX: Require authentication
    const session = await requireAuth();
    if (!session) {
      return unauthorizedResponse("You must be logged in to record visitor identity");
    }

    await dbConnect();
    const body = await req.json();

    // SECURITY FIX: Validate input with zod
    const validated = visitorSchema.parse(body);

    // SECURITY FIX: Get IP from request headers (server-side, cannot be spoofed by client)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Use upsert to update the name if the IP already exists
    const result = await Visitor.updateOne(
      { ip },
      {
        $set: {
          name: validated.name,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: result.upsertedId ? "Visitor recorded" : "Visitor updated"
    });
  } catch (error: any) {
    console.error("Visitor save error:", error);

    // Return validation errors with details
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: "Failed to record visitor" }, { status: 400 });
  }
}