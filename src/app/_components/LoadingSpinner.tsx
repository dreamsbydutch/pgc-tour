import { cn } from "@/src/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn(
        "mx-auto my-2 animate-spin items-center justify-center text-center",
        className,
      )}
    />
  );
}
