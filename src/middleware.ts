import { type NextRequest } from "next/server";
<<<<<<< Updated upstream
import { updateSession } from "./lib/supabase/middleware";
=======
import { middlewareManager, registerMiddlewares } from "./lib/middleware";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

// LOGGING CONTROL:
// To reduce console logging frequency, set these environment variables:
// - MIDDLEWARE_VERBOSE_LOGGING=false (disables detailed middleware execution logs)
process.env.MIDDLEWARE_VERBOSE_LOGGING = "false"; // Disable verbose logging to prevent potential loops

// Import debug utilities in development
if (process.env.NODE_ENV === "development") {
  void import("./lib/middleware/utils/debug");
}

// Register all middleware functions with their priorities
registerMiddlewares();
>>>>>>> Stashed changes

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
<<<<<<< Updated upstream
  matcher: ["/admin"],
=======
  matcher: [
    // Match most routes but exclude static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    // Explicitly include auth routes
    "/auth/:path*",
    // Include most API routes but exclude tRPC
    "/api/((?!trpc).*)",
  ],
>>>>>>> Stashed changes
};
