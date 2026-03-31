import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./types";

// Edge-compatible config — no Prisma, no bcrypt, no Node.js-only deps.
// Used by middleware to verify JWT tokens on the Vercel edge runtime.
const SESSION_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

const cookieName =
  process.env.AUTH_COOKIE_NAME ?? "next-auth.session-token";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/auth/signin",
  },
  cookies: {
    sessionToken: {
      name: cookieName,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
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
