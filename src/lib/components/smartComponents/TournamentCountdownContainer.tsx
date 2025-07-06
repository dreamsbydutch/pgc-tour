import { useTournament } from "@/lib/hooks";
import { TournamentCountdownSkeleton } from "../functionalComponents/loading/TournamentCountdownSkeleton";
import { TournamentCountdown } from "../functionalComponents/TournamentCountdown";

export default function TournamentCountdownContainer({
  inputTourney,
}: {
  inputTourney?: {
    name: string;
    logoUrl?: string | null;
    startDate?: Date;
  } | null;
}) {
  const { next: nextTourney } = useTournament();
  const tourney = inputTourney ?? nextTourney ?? null;

  if (!tourney) return <TournamentCountdownSkeleton />;
  if (tourney.startDate && new Date(tourney.startDate) < new Date())
    return null;

  return (
    <TournamentCountdown
      tourneyName={tourney.name}
      logoUrl={tourney.logoUrl ?? ""}
      startDateTime={new Date(tourney.startDate ?? Date.now())}
    />
  );
}
