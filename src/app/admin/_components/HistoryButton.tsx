"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../_components/ui/button";

export default function HistoryButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/history")} variant="action">
      League History
    </Button>
  );
}
