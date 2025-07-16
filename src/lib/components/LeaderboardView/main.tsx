import { LeaderboardContainer } from "./components/LeaderboardContainer";

interface LeaderboardContainerProps {
  tournamentId: string;
  variant?: "regular" | "playoff" | "historical";
  inputTour?: string;
  userId?: string;
  isPreTournament?: boolean;
  onRefetch?: () => void;
}

export function LeaderboardView(props: LeaderboardContainerProps) {
  return <LeaderboardContainer {...props} />;
}
