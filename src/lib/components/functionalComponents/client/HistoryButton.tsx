import Link from "next/link";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils/core";

export default function HistoryButton({ className }: { className?: string }) {
  return (
    <Link href="/history" className={cn(className)}>
      <Button variant="action">League History</Button>
    </Link>
  );
}
