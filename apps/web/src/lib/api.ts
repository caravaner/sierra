import { appRouter, createCallerFactory } from "@sierra/api";
import { auth } from "@sierra/auth";
import { prisma } from "@sierra/db";

const createCaller = createCallerFactory(appRouter);

export async function api() {
  const session = await auth();
  return createCaller({ prisma, session });
}
