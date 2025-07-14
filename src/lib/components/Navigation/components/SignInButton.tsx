/**
 * SignInButton Component
 *
 * Handles sign-in functionality with Google OAuth
 */

"use client";

import { useState } from "react";
import { LogInIcon } from "lucide-react";
import { Button } from "src/lib/components/functional/ui";
import { signInWithGoogle } from "@app/(auth)/signin/actions";

export function SignInButton() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignIn = () => {
    void signInWithGoogle({ setIsGoogleLoading });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full p-0 lg:w-auto lg:px-3"
      onClick={handleSignIn}
      disabled={isGoogleLoading}
    >
      <LogInIcon size="1.5rem" className="lg:mr-2" />
      <span className="hidden font-barlow text-2xl font-semibold lg:inline-block">
        {isGoogleLoading ? "Signing in..." : "SIGN IN"}
      </span>
    </Button>
  );
}
