"use server";

import { getLeaderboardHeaderData } from "@/server/actions/leaderboard-header";
import { LeaderboardHeader } from "../../functionalComponents/client/LeaderboardHeader";

interface LeaderboardHeaderContainerProps {
  focusTourney: {
    id: string;
    logoUrl: string | null;
    name: string;
    startDate: Date;
    endDate: Date;
    currentRound: number | null;
    seasonId: string;
    tierId: string;
  };
}

export default async function LeaderboardHeaderContainer({
  focusTourney,
}: LeaderboardHeaderContainerProps) {
  const { course, tier, groupedTournaments } =
    await getLeaderboardHeaderData(focusTourney);

  return (
    <LeaderboardHeader
      focusTourney={focusTourney}
      course={course}
      tier={tier}
      groupedTournaments={groupedTournaments}
    />
  );
}
