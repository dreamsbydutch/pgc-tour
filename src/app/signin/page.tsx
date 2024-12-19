"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Icons } from "../_components/Icons";
import { toast } from "@/src/lib/hooks/use-toast";

export default function SignInPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const supabase = createClient();

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (_error) {
      toast({
        title: "Please try again.",
        description: "There was an error logging in with Google.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex h-[100vh] flex-col">
      <h1 className="py-4 text-center font-yellowtail text-5xl md:text-7xl">
        Welcome to the PGC Tour
      </h1>
      <h2 className="max-w-xl text-center font-varela text-xl text-slate-600 mt-2">
        Please create an account below to access the clubhouse.
      </h2>
      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={isGoogleLoading}
        className="w-[15rem] h-[5rem] mt-6"
      >
        {isGoogleLoading ? (
          <Icons.loaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 size-6" />
        )}{" "}
        Sign in with Google
      </Button>
    </div>
  );
}
