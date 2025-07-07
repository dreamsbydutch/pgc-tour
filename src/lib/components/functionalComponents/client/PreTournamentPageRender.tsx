"use client";

import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { TournamentCountdown } from "./TournamentCountdown";
import { formatMoney, formatRank } from "../../../utils/domain/formatting";
import { Button } from "../ui/button";
import LoadingSpinner from "../loading/LoadingSpinner";
import { cn } from "../../../utils/core";
import { useState, memo } from "react";

interface PreTournamentPageProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate">;
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<TourCard, "points" | "earnings" | "position"> | null;
  existingTeam?: Pick<Team, "id"> | null;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
  isTeamLoading: boolean;
  teamError?: string | null;
  pickingTeam: boolean;
}

export default function PreTournamentPageRender(props: PreTournamentPageProps) {
  const {
    tournament,
    member,
    tourCard,
    existingTeam,
    teamGolfers,
    isTeamLoading,
    teamError,
    pickingTeam,
  } = props;

  // Show team creation page if pickingTeam is true
  if (pickingTeam) {
    return null;
  }

  // Show loading skeleton if loading
  if (isTeamLoading) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <TeamPickFormSkeleton existingTeam={existingTeam} />
      </>
    );
  }

  // Show error if there is one
  if (teamError) {
    return (
      <>
        <TournamentCountdown tourney={tournament} />
        <ErrorBanner message={teamError ?? "Unknown error"} />
      </>
    );
  }

  // Show countdown if missing required data
  if (!tourCard || !member) {
    return <TournamentCountdown tourney={tournament} key={tournament.id} />;
  }

  // Only allow team pick within 4 days of tournament start
  const msUntilStart = new Date(tournament.startDate).getTime() - Date.now();
  const canPickTeam = msUntilStart <= 4 * 24 * 60 * 60 * 1000;

  return (
    <div>
      <TournamentCountdown tourney={tournament} key={tournament.id} />
      {canPickTeam && (
        <TeamPickForm
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
          setPickingTeam={setPickingTeam}
        />
      )}
    </div>
  );
}

const ErrorBanner = memo(function ErrorBanner({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-32 w-full items-center justify-center text-red-500">
      Error loading tournament data: {message}
    </div>
  );
});

export function TeamPickFormSkeleton({
  existingTeam,
}: {
  existingTeam?: Pick<Team, "id"> | null;
}) {
  return (
    <div>
      <div className="mx-auto my-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
        <div className="mx-auto mb-3 h-8 w-48 animate-pulse rounded bg-slate-200"></div>
        <div className="mx-auto mb-4 h-6 w-64 animate-pulse rounded bg-slate-200"></div>
        {existingTeam &&
          Array.from({ length: 10 }).map((_, i) => (
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

const TeamPickForm = memo(function TeamPickForm({
  tourCard,
  member,
  existingTeam,
  teamGolfers,
  setPickingTeam,
}: {
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<TourCard, "points" | "earnings" | "position"> | null;
  existingTeam: Pick<Team, "id"> | null | undefined;
  teamGolfers:
    | Pick<Golfer, "id" | "playerName" | "worldRank" | "rating" | "group">[]
    | undefined;
  setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isOpeningForm, setIsOpeningForm] = useState(false);

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
        ?.slice()
        .sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
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
});
