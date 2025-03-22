"use client";

import type {
  TeamData,
  TourCardData,
  TournamentData,
} from "@/src/types/prisma_include";
import { MobileListing } from "./MobileListing";
import { TabletListing } from "./TabletListing";
import { DesktopListing } from "./DesktopListing";

export function PGCListing({
  tournament,
  team,
  tourCard,
}: {
  tournament: TournamentData;
  team: TeamData;
  tourCard?: TourCardData;
}) {
  if (typeof window === "undefined")
    return (
      <MobileListing
        {...{ type: "PGC", tournament, tourCard, userTeam: team }}
      />
    );
  const width = window.innerWidth;
  return width < 650 ? (
    <MobileListing {...{ type: "PGC", tournament, tourCard, userTeam: team }} />
  ) : (
    <DesktopListing
      {...{ type: "PGC", tournament, tourCard, userTeam: team }}
    />
  );
}
