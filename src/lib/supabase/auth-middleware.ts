import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function authGuard(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user and trying to access admin, redirect home
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If user exists, set basic user data in headers
  if (user) {
    // Set basic user data in headers for downstream server components
    response.headers.set("x-user-id", String(user.id));
    response.headers.set("x-user-email", String(user.email ?? ""));
    response.headers.set("x-user-avatar", String(user.user_metadata?.avatar_url ?? ""));

    // Admin access check (using email directly from Supabase)
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      user.email !== "chough14@gmail.com"
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
  }

  return response;
}
