import { type NextRequest } from "next/server";
import { middlewareManager, createMiddleware } from "./lib/middleware";
import { 
  authMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  analyticsMiddleware,
  responseEnhancementMiddleware
} from "./lib/middleware/middlewares";

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./lib/middleware/debug');
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
    "/((?!_next/static|_next/image|favicon.ico|sw.js|logo192.png|logo512.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
