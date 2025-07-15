import type { Tournament } from "@prisma/client";
import { getAuthData } from "@pgc-auth";
import { getCurrentTourCard, getTournamentTeamData } from "@pgc-serverActions";
import { TournamentCountdown } from "@pgc-components";
import { PreTournamentContent } from "./components/PreTournamentContent";

interface PreTournamentPageProps {
  tournament: Pick<
    Tournament,
    "id" | "name" | "logoUrl" | "startDate" | "seasonId"
  >;
}

export async function PreTournamentPage({
  tournament,
}: PreTournamentPageProps) {
  // Fetch member (user) from headers (server-side)
  const { user, member, isAuthenticated } = await getAuthData();
  const tourCard = await getCurrentTourCard();

  // Only fetch team if tourCard exists
  const team = tourCard
    ? await getTournamentTeamData({
        tournamentId: tournament.id,
        tourCardId: tourCard.id,
      })
    : null;

  // Handle unauthenticated user
  if (!user) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <PreTournamentContent
          tournament={tournament}
          member={null}
          tourCard={null}
          existingTeam={null}
          teamGolfers={[]}
        />
      </>
    );
  }

  // Handle user without member profile
  if (!isAuthenticated || !member) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <div className="text-center">Please sign in to pick a team.</div>
      </>
    );
  }

  // Handle member without tour card
  if (!tourCard) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <div className="text-center">
          Tour Card was not found for - {member.firstname} {member.lastname} (
          {member.email})
        </div>
      </>
    );
  }

  return (
    <>
      <TournamentCountdown tourney={tournament} />
      <PreTournamentContent
        tournament={tournament}
        member={member}
        tourCard={tourCard}
        existingTeam={team}
        teamGolfers={team?.golfers ?? []}
      />
    </>
  );
}
