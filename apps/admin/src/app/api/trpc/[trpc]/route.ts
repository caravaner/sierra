import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const dynamic = "force-dynamic";
import { auth } from "@sierra/auth";
import { appRouter, type TRPCContext } from "@sierra/api";
import { prisma } from "@sierra/db";
import {Session} from "next-auth";

// Memoize auth() per HTTP request — all procedures in a tRPC batch share the same session
const sessionCache = new WeakMap<Request, Promise<Session | null>>();

const handler = (req: Request) => {
  if (!sessionCache.has(req)) {
    sessionCache.set(req, auth() as Promise<Session | null>);
  }
  const sessionPromise = sessionCache.get(req)!;

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<TRPCContext> => {
      const session = await sessionPromise;
      return {
        prisma,
        session,
      };
    },
  });
};

export { handler as GET, handler as POST };
