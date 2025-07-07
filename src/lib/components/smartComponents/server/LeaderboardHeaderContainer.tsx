"use server";

import { LeaderboardHeader } from "../../functionalComponents/client/LeaderboardHeader";
import { getTournamentData } from "@/server/api/actions";

interface LeaderboardHeaderContainerProps {
  focusTourney: {
    id: string;
  };
}

export default async function LeaderboardHeaderContainer({
  focusTourney,
}: LeaderboardHeaderContainerProps) {
  const { all } = await getTournamentData();
  const outputTourney = all.find((t) => t.id === focusTourney.id);
  const seasonTourneys = all.filter(
    (t) => t.season.id === outputTourney?.season.id,
  );

  return (
    <LeaderboardHeader
      focusTourney={outputTourney!}
      inputTournaments={seasonTourneys}
    />
  );
}
