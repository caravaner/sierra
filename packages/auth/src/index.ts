import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@sierra/db";
import { makeLogger } from "@sierra/logger";
import { authConfig } from "./config";
import type { UserRole } from "./types";

export type { UserRole } from "./types";
export type { Session } from "next-auth";

const log = makeLogger({ module: "auth" });

const config: NextAuthConfig = {
  ...authConfig,
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const login = (credentials.login as string).trim();
        const isEmail = login.includes("@");
        const isPhone = /^\+?\d[\d\s\-().]{6,}$/.test(login);

        const user = isEmail
          ? await prisma.user.findUnique({ where: { email: login } })
          : isPhone
            ? await prisma.user.findUnique({ where: { phone: login } })
            : await prisma.user.findFirst({ where: { name: login } });

        if (!user?.hashedPassword) {
          log.warn({ login }, "auth.authorize.user_not_found");
          return null;
        }

        if (user.isActive === false) {
          log.warn({ userId: user.id }, "auth.authorize.user_inactive");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword,
        );

        if (!isValid) {
          log.warn({ userId: user.id }, "auth.authorize.bad_password");
          return null;
        }

        log.info({ userId: user.id, role: user.role }, "auth.authorize.ok");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      log.info({ userId: user.id, email: user.email }, "auth.signIn");
    },
    async signOut() {
      log.info("auth.signOut");
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
