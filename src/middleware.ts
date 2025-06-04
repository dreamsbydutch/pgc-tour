import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Include all pages and API routes for comprehensive auth handling
    "/((?!_next/static|_next/image|favicon.ico|sw.js|logo192.png|logo512.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
