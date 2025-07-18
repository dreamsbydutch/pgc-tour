"use client";

import { useState } from "react";

import { signInWithGoogle } from "@app/(auth)/signin/actions";
import Link from "next/link";
import { Button } from "src/lib/components/functional/ui";
import { Icons } from "@pgc-components";
import { useUser } from "@pgc-auth";

export default function SignInPage() {
  const { user } = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  if (user) return null;
  return (
    <div className="flex h-[100vh] flex-col">
      <h2 className="mx-auto my-2 max-w-xl text-center font-varela text-xl text-slate-600">
        Sign in with your Google account to access the PGC clubhouse.
      </h2>
      <Button
        type="button"
        variant="secondary"
        onClick={() => signInWithGoogle({ setIsGoogleLoading })}
        disabled={isGoogleLoading}
        className="mx-auto my-6 h-[3.5rem] w-[15rem] border-2"
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
