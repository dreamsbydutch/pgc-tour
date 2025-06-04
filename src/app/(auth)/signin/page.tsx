"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/app/_components/ui/button";
import { Icons } from "../../_components/Icons";
import { signInWithGoogle } from "./actions";
import Link from "next/link";
import { useAuth } from "@/src/lib/auth/AuthContext";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

export default function SignInPage() {
  const { member, isLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const router = useRouter();
  
  console.log("🔐 SignIn page render:", { 
    member: !!member, 
    memberEmail: member?.email,
    isLoading, 
    isGoogleLoading 
  });
  
  // Handle client-side redirect for authenticated users
  useEffect(() => {
    if (member && !isLoading) {
      console.log("🔄 Authenticated user detected, redirecting to home");
      router.push("/");
    }
  }, [member, isLoading, router]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-[100vh] flex-col items-center justify-center">
        <div className="text-lg text-slate-600">Checking authentication...</div>
      </div>
    );
  }
  
  // Don't show signin if already authenticated
  if (member) {
    return (
      <div className="flex h-[100vh] flex-col items-center justify-center">
        <div className="text-lg text-slate-600">Already signed in, redirecting...</div>
      </div>
    );
  }
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
