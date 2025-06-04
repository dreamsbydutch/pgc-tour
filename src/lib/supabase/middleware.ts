import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Enhanced middleware that integrates with the centralized auth system
 * Provides session management, cache coordination, and auth state management
 */

// Auth state headers for client-side coordination
const AUTH_HEADERS = {
  USER_ID: 'x-auth-user-id',
  USER_EMAIL: 'x-auth-user-email',
  AUTH_STATUS: 'x-auth-status',
  SESSION_UPDATED: 'x-session-updated',
  CACHE_HINT: 'x-cache-hint'
} as const;

// Routes that should skip auth processing
const SKIP_AUTH_ROUTES = [
  '/auth/callback',
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
] as const;

// Admin-only routes
const ADMIN_ROUTES = ['/admin'] as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/auth-code-error'
] as const;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasAuthParams = request.nextUrl.searchParams.has('auth_success');
  const referer = request.headers.get('referer');
  
  console.log("🔒 Enhanced middleware running for:", {
    pathname,
    hasAuthParams,
    referer: referer?.split('/').pop(),
    userAgent: request.headers.get('user-agent')?.slice(0, 50)
  });

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

  // Skip auth checks for specific routes to prevent interference
  if (SKIP_AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    console.log("🔄 Skipping auth checks for protected route:", pathname);
    return supabaseResponse;
  }

  // Get the current user from Supabase (with timeout to prevent hanging)
  let user: User | null = null;
  let authError: Error | null = null;
  
  try {
    const userResponse = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      )
    ]);
    
    // Type the response properly
    const authResponse = userResponse as { data: { user: User | null }, error: Error | null };
    user = authResponse.data?.user ?? null;
    authError = authResponse.error;
  } catch (error) {
    console.warn("⚠️ Auth check failed in middleware:", error);
    authError = error instanceof Error ? error : new Error('Unknown auth error');
  }

  console.log("👤 User status in middleware:", {
    authenticated: !!user,
    email: user?.email,
    hasAuthError: !!authError,
    pathname,
    isPublicRoute: isPublicRoute(pathname)
  });

  // Add auth headers for client-side coordination
  if (user) {
    supabaseResponse.headers.set(AUTH_HEADERS.USER_ID, user.id);
    supabaseResponse.headers.set(AUTH_HEADERS.USER_EMAIL, user.email || '');
    supabaseResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, 'authenticated');
    supabaseResponse.headers.set(AUTH_HEADERS.SESSION_UPDATED, Date.now().toString());
  } else {
    supabaseResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, 'unauthenticated');
    if (authError) {
      supabaseResponse.headers.set(AUTH_HEADERS.CACHE_HINT, 'auth-error');
    }
  }

  // Admin route protection
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    if (!user || user.email !== "chough14@gmail.com") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      console.log("🚫 Redirecting non-admin user away from admin page");
      return NextResponse.redirect(url);
    }
  }

  // Handle auth success parameter from callback
  const authSuccess = request.nextUrl.searchParams.get('auth_success');
  if (authSuccess === 'true' && user) {
    // Remove auth success parameter and redirect to clean URL
    const url = request.nextUrl.clone();
    url.searchParams.delete('auth_success');
    url.searchParams.delete('timestamp');
    console.log("🧹 Cleaning auth success parameters from URL");
    
    // Create response with redirect
    const redirectResponse = NextResponse.redirect(url);
    
    // Add cache refresh hint for client
    redirectResponse.headers.set(AUTH_HEADERS.CACHE_HINT, 'refresh-after-auth');
    redirectResponse.headers.set(AUTH_HEADERS.USER_ID, user.id);
    redirectResponse.headers.set(AUTH_HEADERS.USER_EMAIL, user.email || '');
    redirectResponse.headers.set(AUTH_HEADERS.AUTH_STATUS, 'authenticated');
    redirectResponse.headers.set(AUTH_HEADERS.SESSION_UPDATED, Date.now().toString());
    
    return redirectResponse;
  }

  // Redirect authenticated users away from signin/signup pages
  if (user && PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Only redirect from auth pages, not from error pages
    // Also check if this is coming from an auth callback to avoid redirect loops
    const fromCallback = request.nextUrl.searchParams.has('auth_success') || 
                        request.headers.get('referer')?.includes('/auth/callback') ||
                        request.headers.get('referer')?.includes('/signin');
    
    if ((pathname.startsWith('/signin') || pathname.startsWith('/signup')) && !fromCallback) {
      console.log("🔄 Would redirect authenticated user, but checking timing...");
      
      // Add a small delay to avoid race conditions with client-side auth
      // Let the client-side auth handle the redirect instead for now
      console.log("⏳ Letting client-side handle auth redirect to avoid race condition");
      
      // Add headers but don't redirect immediately
      supabaseResponse.headers.set(AUTH_HEADERS.CACHE_HINT, 'auth-redirect-suggested');
    }
  }

  // For unauthenticated users on protected routes, check if they should be redirected
  if (!user && !isPublicRoute(pathname) && !isApiRoute(pathname)) {
    // Add cache hint that auth is required
    supabaseResponse.headers.set(AUTH_HEADERS.CACHE_HINT, 'auth-required');
    
    // For now, let the client handle auth redirects to avoid breaking the flow
    // The AuthContext will handle redirecting users who need to sign in
    console.log("ℹ️ Unauthenticated user on protected route, letting client handle");
  }

  return supabaseResponse;
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
         pathname === '/' || // Home page is public
         pathname.startsWith('/tournaments') || // Tournament listings are public
         pathname.startsWith('/standings'); // Standings are public
}

/**
 * Check if a route is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Utility function to extract auth info from middleware headers
 * For use in client-side code that needs to sync with middleware state
 */
export function extractAuthHeaders(headers: Headers) {
  return {
    userId: headers.get(AUTH_HEADERS.USER_ID),
    userEmail: headers.get(AUTH_HEADERS.USER_EMAIL),
    authStatus: headers.get(AUTH_HEADERS.AUTH_STATUS) as 'authenticated' | 'unauthenticated' | null,
    sessionUpdated: headers.get(AUTH_HEADERS.SESSION_UPDATED),
    cacheHint: headers.get(AUTH_HEADERS.CACHE_HINT)
  };
}
