import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../functionalComponents/client/PreTournamentPageRender";
import { getAuthData } from "@pgc-auth";
import { getCurrentTourCard, getTournamentTeamData } from "@pgc-serverActions";
import { TournamentCountdown } from "@pgc-components";

export default async function PreTournamentPage({
  tournament,
}: {
  tournament: Pick<
    Tournament,
    "id" | "name" | "logoUrl" | "startDate" | "seasonId"
  >;
}) {
  // Fetch member (user) from headers (server-side)
  const { user, member } = await getAuthData();
  const tourCard = await getCurrentTourCard();

  // Only fetch team if tourCard exists
  const team = tourCard
    ? await getTournamentTeamData({
        tournamentId: tournament.id,
        tourCardId: tourCard.id,
      })
    : null;

  if (!user) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <PreTournamentPageRender
          tournament={tournament}
          member={member}
          tourCard={tourCard}
          existingTeam={team}
          teamGolfers={team?.golfers ?? []}
        />
      </>
    );
  }
  if (!member) {
    return (
      <div className="text-center">Member not found for - {user.email}</div>
    );
  }
  if (!tourCard) {
    return (
      <div className="text-center">
        Tour Card was not found for - {member.firstname} {member.lastname} (
        {member.email})
      </div>
    );
  }
  return (
    <>
      <TournamentCountdown tourney={tournament} />
      <PreTournamentPageRender
        tournament={tournament}
        member={member}
        tourCard={tourCard}
        existingTeam={team}
        teamGolfers={team?.golfers ?? []}
      />
    </>
  );
}
