import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { getAuthData } from "@pgc-auth";
import { getCurrentTourCard, getTournamentTeamData } from "@pgc-serverActions";
import { TournamentCountdown } from "@pgc-components";
import { Button, LoadingSpinner } from "@pgc-ui";
import { cn, formatMoney, formatRank } from "@pgc-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface PreTournamentPageProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate">;
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<TourCard, "points" | "earnings" | "position"> | null;
  existingTeam?: Pick<Team, "id"> | null;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
}

function PreTournamentPageRender(props: PreTournamentPageProps) {
  const { tournament, member, tourCard, existingTeam, teamGolfers } = props;
  const msUntilStart = new Date(tournament.startDate).getTime() - Date.now();
  const canPickTeam = msUntilStart <= 4 * 24 * 60 * 60 * 1000;
  return (
    <div>
      {canPickTeam && tourCard && member && (
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      )}
    </div>
  );
}

function TeamPickForm({
  tournament,
  tourCard,
  member,
  existingTeam,
  teamGolfers,
}: {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate">;
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<TourCard, "points" | "earnings" | "position"> | null;
  existingTeam: Pick<Team, "id"> | null | undefined;
  teamGolfers:
    | Pick<Golfer, "id" | "playerName" | "worldRank" | "rating" | "group">[]
    | undefined;
}) {
  const [isOpeningForm, setIsOpeningForm] = useState(false);
  const router = useRouter();

  const handleOpenForm = () => {
    setIsOpeningForm(true);
    router.push(`/tournament/${tournament.id}/create-team`);
  };

  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <div className="text-2xl font-bold">
        {member?.firstname} {member?.lastname}
      </div>
      {(member?.account ?? 0) > 0 && (
        <div className="mx-auto mb-8 w-5/6 text-center text-lg italic text-red-600">{`Please send ${formatMoney(member?.account ?? 0)} to puregolfcollectivetour@gmail.com to unlock your picks.`}</div>
      )}
      <div className="text-lg font-bold">{`${formatRank(+(tourCard?.position ?? 0))} - ${tourCard?.points.toLocaleString()} pts${tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""}`}</div>
      {teamGolfers
        ?.sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
        ?.sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
        ?.map((golfer, i) => (
          <div
            key={golfer?.id}
            className={cn(
              i % 2 !== 0 && i < 9 && "border-b border-slate-500",
              i === 0 && "mt-2",
              "py-0.5",
            )}
          >
            <div className="text-lg">
              {`#${golfer?.worldRank} ${golfer?.playerName} (${golfer?.rating})`}
            </div>
          </div>
        ))}
      <Button
        onClick={handleOpenForm}
        disabled={isOpeningForm || (member?.account ?? 0) > 0}
        variant={"action"}
        className="mb-4 mt-8 text-xl"
        size="lg"
      >
        {isOpeningForm ? (
          <LoadingSpinner />
        ) : existingTeam ? (
          "Change Your Team"
        ) : (
          "Create Your Team"
        )}
      </Button>
    </div>
  );
}
