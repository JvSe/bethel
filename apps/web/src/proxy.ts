import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/registro",
  "/aceitar-convite",
  "/privacidade",
  "/termos",
  "/esqueci-senha",
  "/redefinir-senha",
  "/verificar-email",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cookie presence is not a valid session. Do not send /login or /registro
  // to /inicio here — an expired cookie would loop: /login → /inicio → /login.

  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|favicon/|manifest.webmanifest).*)"],
};
