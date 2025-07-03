// components/AuthProvider.tsx
"use client";

import { SessionContextProvider, useSessionContext } from "@supabase/auth-helpers-react";
import { createClient } from "../supabase/client";

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
