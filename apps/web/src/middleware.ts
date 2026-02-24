import { auth } from "@sierra/auth";
import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";

const protectedRoutes = ["/orders", "/checkout"];

const middleware: NextMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|manifest\\.json|offline\\.html|icon-.*\\.svg|images/).*)"],
};
