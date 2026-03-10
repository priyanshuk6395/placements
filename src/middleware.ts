import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Using an explicit function wrapper to satisfy Next.js "middleware" convention
export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth internals)
     * - login (The login page)
     * - _next/static, _next/image, favicon.ico, and public assets
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ],
};