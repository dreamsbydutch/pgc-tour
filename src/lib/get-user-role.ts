import "server-only";

import { type JWTPayload, jwtVerify } from "jose";

import { createClient } from "@/lib/supabase/server";
import { api } from "../trpc/server";

// Extend the JWTPayload type to include Supabase-specific metadata
type SupabaseJwtPayload = JWTPayload & {
  app_metadata: {
    role: string;
  };
};

export async function getUserRole() {
  // Create a Supabase client for server-side operations
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const member = await api.member.getById({ memberId: user?.id });

  return member?.role;
}
