import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// Re-export authOptions for use in route handlers
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    return null;
  }
  return session;
}

export function unauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

// Simple in-memory rate limiter for credentials
// In production, use Redis-backed rate limiter (rate-limiter-flexible package)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now > record.resetTime) {
    // No record or expired, reset counter
    loginAttempts.set(identifier, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minute window
    });
    return true;
  }

  // Max 5 attempts per 15 minutes
  if (record.count >= 5) {
    return false;
  }

  record.count++;
  return true;
}
