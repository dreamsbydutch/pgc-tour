import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Admin configuration
const ADMIN_EMAIL = "chough14@gmail.com";
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/signin", "/signup"];

// Auth headers
const AUTH_HEADERS = {
  USER_ID: "x-user-id",
  USER_EMAIL: "x-user-email", 
  USER_AVATAR: "x-user-avatar",
  AUTH_STATUS: "x-auth-status",
} as const;

/**
 * Creates the authentication middleware
 */
export function createAuthMiddleware() {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Create response
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Create Supabase client
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

    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser();

    // Set auth headers
    if (user && !error) {
      response.headers.set(AUTH_HEADERS.USER_ID, user.id);
      response.headers.set(AUTH_HEADERS.USER_EMAIL, user.email ?? "");
      response.headers.set(AUTH_HEADERS.USER_AVATAR, user.user_metadata?.avatar_url as string ?? "");
      response.headers.set(AUTH_HEADERS.AUTH_STATUS, "authenticated");
    } else {
      response.headers.set(AUTH_HEADERS.AUTH_STATUS, "unauthenticated");
    }

    // Route protection logic
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    // Protect admin routes
    if (isAdminRoute) {
      if (!user) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }
      if (user.email !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  };
}
