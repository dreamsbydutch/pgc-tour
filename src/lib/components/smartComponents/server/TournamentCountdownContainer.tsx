import { getTournamentData } from "@/server/api/actions";
import { TournamentCountdownSkeleton } from "../../functionalComponents/loading/TournamentCountdownSkeleton";
import { TournamentCountdown } from "../../functionalComponents/client/TournamentCountdown";
import type { Tournament } from "@prisma/client";

export default async function TournamentCountdownContainer({
  inputTourney,
}: {
  inputTourney?: Pick<Tournament, "name" | "logoUrl" | "startDate"> | null;
}) {
  const { next: nextTourney } = await getTournamentData();
  const tourney: Pick<Tournament, "name" | "logoUrl" | "startDate"> | null =
    inputTourney ?? nextTourney ?? null;

  if (!tourney) return <TournamentCountdownSkeleton />;
  if (tourney.startDate && new Date(tourney.startDate) < new Date())
    return null;

  return <TournamentCountdown tourney={tourney} />;
}
