"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Icons } from "../_components/Icons";
import { signInWithGoogle } from "./actions";
import Link from "next/link";

export default function SignInPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  return (
    <div className="flex h-[100vh] flex-col">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        Welcome to the PGC Tour
      </h1>
      <p className="mb-4 max-w-xl text-center font-varela text-base text-slate-500 md:text-lg">
        An elite fantasy golf experience
      </p>
      <h2 className="mt-2 max-w-xl text-center font-varela text-xl text-slate-600">
        Sign in with your Google account below to access the PGC clubhouse.
      </h2>
      <Button
        type="button"
        variant="secondary"
        onClick={() => signInWithGoogle({ setIsGoogleLoading })}
        disabled={isGoogleLoading}
        className="mx-auto mt-6 h-[3.5rem] w-[15rem] border-2"
      >
        {isGoogleLoading ? (
          <Icons.loaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <Icons.google className="size-6" />
        )}
        <div className="text-lg">Sign in with Google</div>
      </Button>
      <div className="mt-4 flex flex-col justify-start">
        <Link href={"/privacy"} className="text-xs text-slate-400">
          Privacy Policy
        </Link>
        <Link href={"/terms"} className="text-xs text-slate-400">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
