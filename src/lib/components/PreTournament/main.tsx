import type { Tournament } from "@prisma/client";
import { getAuthData } from "@pgc-auth";
import { getCurrentTourCard, getTournamentTeamData } from "@pgc-serverActions";
import { TournamentCountdown } from "@pgc-components";
import { PreTournamentContent } from "./components/PreTournamentContent";
import { SignInButton } from "../Navigation";
import { LeaderboardView } from "@pgc-components/LeaderboardView";

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
        <div className="text-center">Please sign in to pick a team.</div>
        <SignInButton />
        <PreTournamentContent
          tournament={tournament}
          member={null}
          tourCard={null}
          existingTeam={null}
          teamGolfers={[]}
          playoffEventIndex={0}
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
        <SignInButton />
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

  // Compute playoff event index within the season (server-side)
  // Fetch season tournaments and determine index of this playoff event.
  const { getTournamentInfo } = await import("@pgc-serverActions");
  const currentSeason = await (
    await import("@pgc-serverActions")
  ).getCurrentSeason();
  const { season: allTournaments } = await getTournamentInfo(
    currentSeason?.id ?? tournament.seasonId,
  );
  const playoffTournaments = allTournaments
    .filter((t) => (t.tier?.name ?? "").toLowerCase().includes("playoff"))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  const idx = playoffTournaments.findIndex((t) => t.id === tournament.id);
  const playoffEventIndex = idx === -1 ? 0 : idx + 1; // 0 = regular, 1..3 = playoff events

  return (
    <>
      <TournamentCountdown tourney={tournament} />
      <PreTournamentContent
        tournament={tournament}
        member={member}
        tourCard={tourCard}
        existingTeam={team}
        teamGolfers={team?.golfers ?? []}
        playoffEventIndex={playoffEventIndex}
      />
      {playoffEventIndex > 0 && (
        <>
          <div className="mt-4 text-center text-sm text-gray-500">
            Playoff Event {playoffEventIndex} of 3
          </div>
          <LeaderboardView
            tournamentId={tournament.id}
            userId={member?.id}
            inputTour={tourCard.tourId}
          />
        </>
      )}
    </>
  );
}
