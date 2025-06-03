import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  console.log("🔒 Middleware running for:", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Skip auth checks for callback routes to prevent interference
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    console.log("🔄 Skipping auth checks for callback route");
    return supabaseResponse;
  }

  // Get the current user from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("👤 User status in middleware:", !!user, user?.email);

  // Redirect non-admin users trying to access admin pages to the home page
  if (
    !user ||
    (user &&
      user.email !== "chough14@gmail.com" &&
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    console.log("🚫 Redirecting non-admin to home");
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users attempting to access the sign-in page to the home page
  if (user && request.nextUrl.pathname.startsWith("/signin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    console.log("✅ Redirecting authenticated user away from signin");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
