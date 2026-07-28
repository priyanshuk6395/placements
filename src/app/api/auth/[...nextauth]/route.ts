import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { checkLoginRateLimit } from "@/lib/auth";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // SECURITY FIX: Rate limiting on login attempts
        // Identifier is the attempted username
        const identifier = credentials?.username || "unknown";
        
        if (!checkLoginRateLimit(identifier)) {
          console.warn(`Rate limit exceeded for login attempt: ${identifier}`);
          throw new Error("Too many login attempts. Please try again in 15 minutes.");
        }

        // SECURITY NOTE: This is plaintext comparison in-memory.
        // For production: hash credentials with bcrypt and store in secure DB
        // Consider: rotating credentials via secure secrets rotation
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Administrator" };
        }
        
        throw new Error("Invalid credentials");
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.admin = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).admin = token.admin;
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };