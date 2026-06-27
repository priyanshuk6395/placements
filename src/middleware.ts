import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only require a token for the routes matched below
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // CRITICAL FIX: We now ONLY lock the /admin route. 
  // The public '/' route and '/api/traffic' are now completely open.
  matcher: ["/admin/:path*"],
};