"use client";

import TournamentCountdown from "../../components/ui/TournamentCountdown";
import { cn, formatMoney, formatRank } from "@/src/lib/utils";
import { Button } from "@/src/app/_components/ui/button";
import { useState } from "react";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { useMainStore } from "@/src/lib/store/store";
import type {
  Course,
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { api } from "@/src/trpc/react";
import CreateTeamPage from "./CreateTeamPage";

/**
 * PreTournamentPage Component
 *
 * Displays the pre-tournament page, including:
 * - A countdown timer until the tournament starts.
 * - A form to create or update the user's team.
 * - Tee times for the user's team.
 *
 * Props:
 * - tournament: The tournament data.
 * - tourCard: The user's tour card data (optional).
 */
export default function PreTournamentPage({
  tournament,
}: {
  tournament: Tournament & { course: Course | null };
}) {
  const [pickingTeam, setPickingTeam] = useState(false);
  const tourCard = useMainStore((state) => state.currentTourCard);
  const member = useMainStore((state) => state.currentMember);
  const { data: existingTeam, isLoading: isTeamLoading } =
    api.team.getByUserTournament.useQuery({
      tourCardId: tourCard?.id ?? "",
      tournamentId: tournament.id,
    });
  const { data: allGolfers, isLoading: isGolfersLoading } =
    api.golfer.getByTournament.useQuery({
      tournamentId: tournament.id,
    });
  const teamGolfers = allGolfers?.filter((a) =>
    existingTeam?.golferIds.includes(a.apiId),
  );

  if (pickingTeam)
    return (
      <CreateTeamPage {...{ tournamentId: tournament.id, setPickingTeam }} />
    );
  // Show loading state while fetching data
  if (isTeamLoading || isGolfersLoading) {
    return (
      <>
        <TournamentCountdown inputTourney={tournament} />
        <TeamPickFormSkeleton existingTeam={existingTeam} />
      </>
    );
  }

  if (!tourCard || !member || !allGolfers || (allGolfers?.length ?? 0) === 0)
    return (
      <TournamentCountdown inputTourney={tournament} key={tournament.id} />
    );
  return (
    <div>
      <TournamentCountdown inputTourney={tournament} key={tournament.id} />
      {!tourCard ||
      new Date(tournament.startDate).getTime() - new Date().getTime() >
        4 * 24 * 60 * 60 * 1000 ? (
        <></>
      ) : (
        <>
          <TeamPickForm
            {...{
              tourCard,
              tournament,
              member,
              existingTeam,
              teamGolfers,
              setPickingTeam,
            }}
          />
          {/* <TeamTeeTimes {...{ tournament }} /> */}
        </>
      )}
    </div>
  );
}

export function TeamPickFormSkeleton({
  existingTeam,
}: {
  existingTeam?: Team | null;
}) {
  return (
    <div>
      <div className="mx-auto my-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
        <div className="mx-auto mb-3 h-8 w-48 animate-pulse rounded bg-slate-200"></div>
        <div className="mx-auto mb-4 h-6 w-64 animate-pulse rounded bg-slate-200"></div>
        {existingTeam &&
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, i) => (
            <div
              key={i}
              className={`py-0.5 ${i % 2 !== 0 && i < 9 ? "border-b border-slate-500" : ""}`}
            >
              <div className="mx-auto h-6 w-3/4 animate-pulse rounded bg-slate-200"></div>
            </div>
          ))}
        <div className="mx-auto mb-4 mt-8 h-10 w-40 animate-pulse rounded bg-slate-300"></div>
      </div>
    </div>
  );
}

/**
 * TeamPickForm Component
 *
 * Displays a form for the user to create or update their team.
 * - Shows the user's current team golfers.
 * - Allows navigation to the team creation page.
 *
 * Props:
 * - tourCard: The user's tour card data.
 * - tournament: The tournament data.
 * - teamGolfers: The list of golfers in the user's team (optional).
 */
function TeamPickForm({
  tourCard,
  member,
  existingTeam,
  teamGolfers,
  setPickingTeam,
}: {
  tourCard: TourCard;
  member: Member;
  existingTeam: Team | null | undefined;
  teamGolfers: Golfer[] | undefined;
  setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isOpeningForm, setIsOpeningForm] = useState(false);

  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <div className="text-2xl font-bold">{member?.fullname}</div>
      {(member?.account ?? 0) > 0 && (
        <div className="mx-auto mb-8 w-5/6 text-center text-lg italic text-red-600">{`Please send ${formatMoney(member?.account ?? 0)} to puregolfcollectivetour@gmail.com to unlock your picks.`}</div>
      )}
      <div className="text-lg font-bold">{`${formatRank(+(tourCard?.position ?? 0))} - ${tourCard?.points.toLocaleString()} pts${tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""}`}</div>
      {teamGolfers
        ?.sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
        .sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity))
        .map((golfer, i) => (
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
        key={existingTeam?.id}
        onClick={() => {
          setIsOpeningForm(true);
          setPickingTeam(true);
        }}
        disabled={(member?.account ?? 0) > 0}
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

/**
 * TeamTeeTimes Component
 *
 * Displays the tee times for the user's team.
 * - Groups golfers by their tee times and starting holes.
 * - Highlights golfers in the user's team.
 *
 * Props:
 * - golfers: The list of all golfers in the tournament (optional).
 * - teamGolfers: The list of golfers in the user's team (optional).
 * - course: The course data (optional).
 */
