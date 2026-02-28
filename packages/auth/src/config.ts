import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./types";

// Edge-compatible config — no Prisma, no bcrypt, no Node.js-only deps.
// Used by middleware to verify JWT tokens on the Vercel edge runtime.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  ...(process.env.AUTH_COOKIE_NAME
    ? { cookies: { sessionToken: { name: process.env.AUTH_COOKIE_NAME } } }
    : {}),
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as Record<string, unknown>).role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
