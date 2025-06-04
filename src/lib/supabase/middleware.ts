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

  // Skip auth checks for API routes to prevent interference
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log("🔄 Skipping auth checks for API route");
    return supabaseResponse;
  }

  // Get the current user from Supabase (with timeout to prevent hanging)
  let user = null;
  try {
    const userResponse = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )
    ]);
    user = (userResponse as any)?.data?.user || null;
  } catch (error) {
    console.warn("⚠️ Auth check failed in middleware:", error);
    // Continue without user if auth check fails
  }

  console.log("👤 User status in middleware:", !!user, user?.email);

  // Only redirect for admin pages if we successfully got user data
  if (user !== null && 
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

  // Only redirect authenticated users from signin if we successfully got user data
  if (user && request.nextUrl.pathname.startsWith("/signin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    console.log("✅ Redirecting authenticated user away from signin");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
