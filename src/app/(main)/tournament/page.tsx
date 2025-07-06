"use client";

import { useLeaderboard } from "@/lib/hooks";
import { useSearchParams } from "next/navigation";

/**
 * Unified tournament page that handles displaying any tournament
 * Uses query parameter ?id=tournamentId instead of path parameter
 */
export default function TournamentPage() {
  const searchParams = useSearchParams();
  const tournamentIdParam = searchParams.get("id");
  const tourIdParam = searchParams.get("tour");

  const tournament = useLeaderboard(
    tournamentIdParam ?? "cm50s1uxs001j84bspe1jtsck",
  );
  
  console.log(tournament);
  
  return <>TEST</>;
}
