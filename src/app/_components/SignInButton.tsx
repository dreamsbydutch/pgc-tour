"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";

export function SignInButton() {
  return (
    <Link
      href="/signin"
      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
    >
      <LogInIcon className="mr-2 size-3.5" />
      Sign in
    </Link>
  );
}
