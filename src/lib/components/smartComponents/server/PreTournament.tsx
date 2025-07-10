import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../functionalComponents/client/PreTournamentPageRender";
import {
  getMemberFromHeaders,
  getMemberWithRelations,
  getUserFromHeaders,
} from "@/lib/auth/utils";
import { getTournamentTeamData } from "@/server/actions/getTournamentTeamData";
import TournamentCountdownContainer from "./TournamentCountdownContainer";
import { getCurrentTourCard } from "@/server/actions/tourCard";

export default async function PreTournamentPage({
  tournament,
}: {
  tournament: Pick<
    Tournament,
    "id" | "name" | "logoUrl" | "startDate" | "seasonId"
  >;
}) {
  const user = await getUserFromHeaders();
  const memberData = await getMemberFromHeaders();
  const member = await getMemberWithRelations();
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
      <div className="text-center">
        Please sign in to view tournament details.
      </div>
    );
  }
  if (!member) {
    if (!memberData) {
      return (
        <div className="text-center">Member not found for - {user.email}</div>
      );
    }
    return (
      <div className="text-center">
        Member error - {memberData.email} / {user.email}
      </div>
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
      <TournamentCountdownContainer inputTourney={tournament} />
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
