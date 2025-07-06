/**
 * LeaderboardHeaderContainer Component
 *
 * Simple server component that fetches data and passes it to the header.
 */

import { getLeaderboardHeaderData } from "@/server/actions";
import LeaderboardHeader from "./LeaderboardHeader";
import type { Tournament } from "@prisma/client";

interface LeaderboardHeaderContainerProps {
  focusTourney: Tournament;
}

export default async function LeaderboardHeaderContainer({
  focusTourney,
}: LeaderboardHeaderContainerProps) {
  const serverData = await getLeaderboardHeaderData(focusTourney);

  return (
    <LeaderboardHeader focusTourney={focusTourney} serverData={serverData} />
  );
}
