import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@sierra/auth";
import { appRouter, type TRPCContext } from "@sierra/api";
import { prisma } from "@sierra/db";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<TRPCContext> => {
      const session = await auth();
      return {
        prisma,
        session,
      };
    },
  });

export { handler as GET, handler as POST };
