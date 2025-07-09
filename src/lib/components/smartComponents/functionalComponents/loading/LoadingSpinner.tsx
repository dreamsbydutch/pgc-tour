import { cn } from "@/lib/utils/main";
import { Loader2 } from "lucide-react";
import React from "react";

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn(
        "h-full w-full animate-spin items-center justify-center text-center",
        className,
      )}
    />
  );
}
