/**
 * Auth System Exports
 * Unified auth system for the PGC Tour app
 */

// Server-side utilities (use in Server Components and API routes)
export {
  getUserFromHeaders,
  getMemberFromHeaders,
  getAuthData,
  isAuthenticated,
  isAdmin,
  getUserId,
  getUserEmail,
  getMemberWithRelations,
  requireAuth,
  requireAdmin,
  type AuthUser,
  type AuthData,
} from "./utils";

// Client-side auth provider and hooks
export { AuthProvider, useHeaderUser, type HeaderUser } from "@pgc-providers";

// Session-based auth hook (for client components)
export { useUser } from "../hooks/hooks";

export { createClient } from "./client";
