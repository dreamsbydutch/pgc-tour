"use client";

import { useAuth } from "@/src/lib/auth/Auth";
import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export default function AuthDebugPage() {
  const { member, isLoading, user, session, isAuthenticated } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get current Supabase session directly
    const getSupabaseData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      setSupabaseUser(user);
      setSupabaseSession(session);
    };

    void getSupabaseData();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">AuthContext State</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
{JSON.stringify({
  isLoading,
  isAuthenticated,
  hasUser: !!user,
  userEmail: user?.email,
  hasMember: !!member,
  memberEmail: member?.email,
  hasSession: !!session,
}, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Direct Supabase State</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
{JSON.stringify({
  hasSupabaseUser: !!supabaseUser,
  supabaseUserEmail: supabaseUser?.email,
  hasSupabaseSession: !!supabaseSession,
  sessionValid: supabaseSession?.expires_at ? new Date(supabaseSession.expires_at * 1000) > new Date() : false,
}, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">URL Information</h2>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
{JSON.stringify({
  currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  searchParams: typeof window !== 'undefined' ? window.location.search : 'unknown',
  origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
}, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Instructions</h2>
          <div className="text-sm bg-white p-3 rounded">
            <p className="mb-2"><strong>To debug the signin issue:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open browser dev tools (F12)</li>
              <li>Go to Network tab</li>
              <li>Navigate to /signin and try to sign in</li>
              <li>Check the network requests and response headers</li>
              <li>Look for middleware headers starting with &apos;x-auth-&apos;</li>
              <li>Check console logs for auth state changes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
