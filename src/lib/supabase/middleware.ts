import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
<<<<<<< Updated upstream

export async function updateSession(request: NextRequest) {
=======
import type { User } from "@supabase/supabase-js";

/**
 * Enhanced middleware that integrates with the centralized auth system
 * Provides session management, cache coordination, and auth state management
 */

// Auth state headers for client-side coordination
const AUTH_HEADERS = {
  USER_ID: "x-auth-user-id",
  USER_EMAIL: "x-auth-user-email",
  AUTH_STATUS: "x-auth-status",
  SESSION_UPDATED: "x-session-updated",
  CACHE_HINT: "x-cache-hint",
} as const;

// Routes that should skip auth processing
const SKIP_AUTH_ROUTES = [
  "/auth/callback",
  "/api/trpc", // Skip tRPC routes - they handle their own auth
  "/api/webhooks", // Skip webhook routes
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/test-store", // Skip our test page to avoid loops during testing
] as const;

// Admin-only routes
const ADMIN_ROUTES = ["/admin"] as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/auth-code-error",
] as const;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Add request ID to prevent processing loops
  const requestId =
    request.headers.get("x-request-id") || Math.random().toString(36);

  // Skip if this request has already been processed (prevent loops)
  if (request.headers.get("x-auth-processed")) {
    return NextResponse.next({ request });
  }

>>>>>>> Stashed changes
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add processing marker to prevent loops
  supabaseResponse.headers.set("x-auth-processed", "true");
  supabaseResponse.headers.set("x-request-id", requestId);

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
<<<<<<< Updated upstream

  // Get the current user from Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect non-admin users trying to access admin pages to the home page
  if (
    !user ||
    (user &&
      user.email !== "chough14@gmail.com" &&
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users attempting to access the sign-in page to the home page
  if (user && request.nextUrl.pathname.startsWith("/signin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
=======
  // Skip auth checks for specific routes to prevent interference
  if (SKIP_AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // Removed "Skipping auth checks" log to reduce console noise
    return supabaseResponse;
  }
  // Get the current user from Supabase (with shorter timeout to prevent hanging)
  let user: User | null = null;
  let authError: Error | null = null;

  try {
    const userResponse = await Promise.race([
      supabase.auth.getUser(),
      new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 2000), // Reduced from 5000ms to 2000ms
      ),
    ]);

    // Type the response properly
    const authResponse = userResponse as {
      data: { user: User | null };
      error: Error | null;
    };
    user = authResponse.data?.user ?? null;
    authError = authResponse.error;
  } catch (error) {
    const authErrorInstance =
      error instanceof Error ? error : new Error("Unknown auth error");
    // Don't log timeout errors as they're common and expected
    if (!authErrorInstance.message.includes("timeout")) {
      console.error(
        "Auth check failed in middleware:",
        authErrorInstance.message,
      );
    }
    authError = authErrorInstance;
  } // Removed user status logging to reduce console noise

  // Add auth headers for client-side coordination
  if (user) {
    supabaseResponse.headers.set(AUTH_HEADERS.USER_ID, user.id);
    supabaseResponse.headers.set(AUTH_HEADERS.USER_EMAIL, user.email ?? "");
    supabaseResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, "authenticated");
    supabaseResponse.headers.set(
      AUTH_HEADERS.SESSION_UPDATED,
      Date.now().toString(),
    );
  } else {
    supabaseResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, "unauthenticated");
    if (authError) {
      supabaseResponse.headers.set(AUTH_HEADERS.CACHE_HINT, "auth-error");
    }
  }

  // Admin route protection
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user || user.email !== "chough14@gmail.com") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      // Redirecting non-admin user away from admin page
      return NextResponse.redirect(url);
    }
  }

  // Handle auth success parameter from callback
  const authSuccess = request.nextUrl.searchParams.get("auth_success");
  if (authSuccess === "true" && user) {
    // Remove auth success parameter and redirect to clean URL
    const url = request.nextUrl.clone();
    url.searchParams.delete("auth_success");
    url.searchParams.delete("timestamp");
    // Cleaning auth success parameters from URL

    // Create response with redirect
    const redirectResponse = NextResponse.redirect(url);

    // Add cache refresh hint for client
    redirectResponse.headers.set(AUTH_HEADERS.CACHE_HINT, "refresh-after-auth");
    redirectResponse.headers.set(AUTH_HEADERS.USER_ID, user.id);
    redirectResponse.headers.set(AUTH_HEADERS.USER_EMAIL, user.email ?? "");
    redirectResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, "authenticated");
    redirectResponse.headers.set(
      AUTH_HEADERS.SESSION_UPDATED,
      Date.now().toString(),
    );

    return redirectResponse;
  }

  // Redirect authenticated users away from signin/signup pages
  if (user && PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // Only redirect from auth pages, not from error pages
    // Also check if this is coming from an auth callback to avoid redirect loops
    const referer = request.headers.get("referer");
    const fromCallback =
      request.nextUrl.searchParams.has("auth_success") ||
      (referer ? referer.includes("/auth/callback") : false) ||
      (referer ? referer.includes("/signin") : false);
    // Note: OR operators are correct here for boolean conditions, not nullish coalescing
    if (
      (pathname.startsWith("/signin") || pathname.startsWith("/signup")) &&
      !fromCallback
    ) {
      // Would redirect authenticated user, but checking timing...

      // Add a small delay to avoid race conditions with client-side auth
      // Let the client-side auth handle the redirect instead for now
      // Letting client-side handle auth redirect to avoid race condition

      // Add headers but don't redirect immediately
      supabaseResponse.headers.set(
        AUTH_HEADERS.CACHE_HINT,
        "auth-redirect-suggested",
      );
    }
  }

  // For unauthenticated users on protected routes, check if they should be redirected
  if (!user && !isPublicRoute(pathname) && !isApiRoute(pathname)) {
    // Add cache hint that auth is required
    supabaseResponse.headers.set(AUTH_HEADERS.CACHE_HINT, "auth-required");

    // For now, let the client handle auth redirects to avoid breaking the flow    // The AuthContext will handle redirecting users who need to sign in
    // Unauthenticated user on protected route, letting client handle
>>>>>>> Stashed changes
  }

  return supabaseResponse;
}
<<<<<<< Updated upstream
=======

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname === "/" || // Home page is public
    pathname.startsWith("/tournaments") || // Tournament listings are public
    pathname.startsWith("/standings")
  ); // Standings are public
}

/**
 * Check if a route is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * Utility function to extract auth info from middleware headers
 * For use in client-side code that needs to sync with middleware state
 */
export function extractAuthHeaders(headers: Headers) {
  return {
    userId: headers.get(AUTH_HEADERS.USER_ID),
    userEmail: headers.get(AUTH_HEADERS.USER_EMAIL),
    authStatus: headers.get(AUTH_HEADERS.AUTH_STATUS) as
      | "authenticated"
      | "unauthenticated"
      | null,
    sessionUpdated: headers.get(AUTH_HEADERS.SESSION_UPDATED),
    cacheHint: headers.get(AUTH_HEADERS.CACHE_HINT),
  };
}
>>>>>>> Stashed changes
