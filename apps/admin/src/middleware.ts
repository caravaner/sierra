import { auth } from "@sierra/auth";
import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";

const middleware: NextMiddleware = auth((req) => {
  if (!req.auth?.user) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = req.auth.user.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  matcher: ["/((?!api|auth|_next/static|_next/image|favicon.ico).*)"],
};
