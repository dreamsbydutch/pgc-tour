"use server";

import { getTournamentInfo } from "@/server/actions/tournament";
import { LeaderboardHeader } from "../functionalComponents/client/LeaderboardHeader";

interface LeaderboardHeaderContainerProps {
  focusTourney: {
    id: string;
    seasonId: string;
  };
}

export default async function LeaderboardHeaderContainer({
  focusTourney,
}: LeaderboardHeaderContainerProps) {
  const { season } = await getTournamentInfo(focusTourney.seasonId);
  const outputTourney = season.find((t) => t.id === focusTourney.id);
  const seasonTourneys = season.filter(
    (t) => t.seasonId === outputTourney?.seasonId,
  );

  return (
    <LeaderboardHeader
      focusTourney={outputTourney!}
      inputTournaments={seasonTourneys}
    />
  );
}
