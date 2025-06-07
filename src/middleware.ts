import { type NextRequest } from "next/server";
import { middlewareManager, createMiddleware } from "./lib/middleware";
import { 
  authMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  analyticsMiddleware,
  responseEnhancementMiddleware
} from "./lib/middleware/middlewares";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

// LOGGING CONTROL:
// To reduce console logging frequency, set these environment variables:
// - MIDDLEWARE_VERBOSE_LOGGING=false (disables detailed middleware execution logs)
// - AXIOM_ENABLE_CONSOLE=false (disables all console logging in production)
// - AXIOM_MIN_LOG_LEVEL=WARN (only shows warnings and errors)

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  void import('./lib/middleware/debug');
}

// Register all middleware functions with their priorities
// Lower priority numbers execute first
createMiddleware("security", 10, securityMiddleware);
createMiddleware("auth", 20, authMiddleware);
createMiddleware("rateLimit", 30, rateLimitMiddleware);
createMiddleware("analytics", 40, analyticsMiddleware);
createMiddleware("responseEnhancement", 50, responseEnhancementMiddleware);

export async function middleware(request: NextRequest) {
  return await middlewareManager.execute(request);
}

export const config = {
  matcher: [
    // Include all pages and API routes for comprehensive auth handling
    // But exclude more static assets to reduce middleware execution frequency
    "/((?!_next/static|_next/image|favicon.ico|sw.js|logo192.png|logo512.png|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
