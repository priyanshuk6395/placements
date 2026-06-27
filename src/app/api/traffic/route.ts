// src/app/api/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import TrafficLog from '@/models/TrafficLog';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Ignore internal traffic or very short pings
    if (!body.path || body.duration < 1) {
      return NextResponse.json({ telemetry: 'Ignored' });
    }

    await dbConnect();

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    
    // Simple bot filter
    const userAgent = req.headers.get('user-agent') || '';
    if (/bot|crawl|slurp|spider/i.test(userAgent)) {
      return NextResponse.json({ telemetry: 'Bot Ignored' });
    }

    await TrafficLog.create({
      ip,
      country: req.headers.get('x-vercel-ip-country') || 'Unknown',
      region: req.headers.get('x-vercel-ip-country-region') || 'Unknown',
      city: decodeURIComponent(req.headers.get('x-vercel-ip-city') || 'Unknown'),
      path: body.path,
      userAgent,
      duration: body.duration,
    });

    return NextResponse.json({ telemetry: 'Acknowledged' });
  } catch (error) {
    console.error("Telemetry Pipeline Error:", error);
    return NextResponse.json({ telemetry: 'Dropped' }, { status: 500 });
  }
}