import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isSignedIn = Boolean(req.auth);
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/sign-in")) {
    if (isSignedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!isSignedIn) {
    const signInUrl = new URL("/sign-in", req.url);
    if (pathname !== "/") {
      signInUrl.searchParams.set("from", `${pathname}${search}`);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
