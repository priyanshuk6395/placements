import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      // Require a token for all protected routes
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // SECURITY FIX: Protect all data-mutating endpoints and admin panel
  // Public endpoints: '/', '/login', '/api/traffic' (read-only telemetry)
  matcher: [
    "/admin/:path*",
    "/api/upload/:path*",
    "/api/placement/:path*",
    "/api/export/:path*",
    "/api/visitor/:path*",
  ],
};