import { useSessionContext } from "@supabase/auth-helpers-react";

export function useUser() {
  const { session, isLoading } = useSessionContext();
  return {
    user: session?.user ?? null,
    session,
    isLoading,
  };
}
