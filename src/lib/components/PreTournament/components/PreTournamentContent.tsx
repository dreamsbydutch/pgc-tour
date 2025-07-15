"use client";

import { useMemo } from "react";
import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { TeamPickForm } from "./TeamPickForm";

export interface PreTournamentContentProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate">;
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<TourCard, "points" | "earnings" | "position"> | null;
  existingTeam?: Pick<Team, "id"> | null;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
}

export function PreTournamentContent({
  tournament,
  member,
  tourCard,
  existingTeam,
  teamGolfers,
}: PreTournamentContentProps) {
  // Memoize the time calculation to prevent constant re-calculations
  const canPickTeam = useMemo(() => {
    const msUntilStart = new Date(tournament.startDate).getTime() - Date.now();
    return msUntilStart <= 4 * 24 * 60 * 60 * 1000;
  }, [tournament.startDate]);

  return (
    <div>
      {canPickTeam && tourCard && member && (
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      )}
    </div>
  );
}
