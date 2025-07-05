"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../../lib/components/ui/button";
import { cn } from "@/old-utils";

export default function HistoryButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      className={cn(className)}
      onClick={() => router.push("/history")}
      variant="action"
    >
      League History
    </Button>
  );
}
