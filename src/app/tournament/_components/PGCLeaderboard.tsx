"use client";

import type {
  TeamData,
  TourCardData,
  TournamentData,
} from "@/src/types/prisma_include";
import { MobileListing } from "./MobileListing";

export function PGCListing({
  tournament,
  team,
  tourCard,
}: {
  tournament: TournamentData;
  team: TeamData;
  tourCard?: TourCardData;
}) {
  return (
    <MobileListing {...{ type: "PGC", tournament, tourCard, userTeam: team }} />
  );
}
