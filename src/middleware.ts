import { type NextRequest } from "next/server";
import { authGuard } from "./lib/supabase/auth-middleware";

export async function middleware(request: NextRequest) {
  return await authGuard(request);
}

export const config = {
  matcher: ["/admin", "/signin"],
};
