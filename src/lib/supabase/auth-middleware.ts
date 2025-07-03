import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function authGuard(request: NextRequest) {
  const token = request.cookies.get("sb-access-token")?.value;

  // If there's no token, redirect from admin
  if (!token && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If there's a token, verify the JWT and check email or role
  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
      );

      const email = payload.email;

      // Email check
      if (
        request.nextUrl.pathname.startsWith("/admin") &&
        email !== "chough14@gmail.com"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // If already signed in and trying to access /signin, redirect home
      if (request.nextUrl.pathname === "/signin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

    } catch (err) {
      console.error("JWT verification failed", err);
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Everything OK, let it through
  return NextResponse.next();
}
