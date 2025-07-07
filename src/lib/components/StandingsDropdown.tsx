"use client";

import { cn } from "@/lib/utils/core/types";
import { formatRank } from "@/lib/utils/domain/formatting";
import { api } from "@/trpc/react";
import type { Member, Team, TourCard, Tournament } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "./functionalComponents/loading/LoadingSpinner";

// Pure helper: filter non-playoff tournaments
const getNonPlayoffTournaments = (
  allTournaments: Tournament[] | undefined,
  seasonId: string,
  allTiers: { id: string; name: string }[] | undefined,
) =>
  allTournaments && allTiers
    ? allTournaments
        .filter((t) => t.seasonId === seasonId)
        .filter(
          (t) =>
            !allTiers
              .filter((tier) => tier.name.toLowerCase().includes("playoff"))
              .map((tier) => tier.id)
              .includes(t.tierId),
        )
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        )
    : undefined;

// Pure helper: filter teams for a tour card
const getTeamsForTourCard = (
  allTeams: Team[] | undefined,
  tourCardId: string,
) => (allTeams ? allTeams.filter((team) => team.tourCardId === tourCardId) : undefined);

// Pure helper: calculate average score
const calculateAverageScore = (teams: Team[] = [], type: "weekday" | "weekend") => {
  const rounds =
    type === "weekday"
      ? teams.reduce((acc, t) => acc + (t.roundOne ?? 0) + (t.roundTwo ?? 0), 0)
      : teams.reduce((acc, t) => acc + (t.roundThree ?? 0) + (t.roundFour ?? 0), 0);

  const roundCount =
    type === "weekday"
      ? teams.filter((t) => t.roundOne).length + teams.filter((t) => t.roundTwo).length
      : teams.filter((t) => t.roundThree).length + teams.filter((t) => t.roundFour).length;

  return Math.round((rounds / (roundCount || 1)) * 10) / 10;
};

// Pure helper: render tournament result
const renderTournamentResult = (
  team: Team | undefined,
  tournament: Tournament,
  isWinner: boolean,
): JSX.Element | string => {
  if (!team) {
    if (new Date(tournament.endDate) > new Date()) return "-";
    return "DNP";
  }
  if (team.position === "CUT") return "CUT";
  return (
    <>
      {team.position}
      <span className={cn("text-2xs", isWinner && "text-xs")}>
        {team.position ? formatRank(+team.position.replace("T", "")).slice(-2) : ""}
      </span>
    </>
  );
};

// Tournament history row (functional, stateless)
const TournamentHistoryRow = ({
  tourneys,
  teams,
  className,
}: {
  tourneys: Tournament[] | undefined;
  teams: Team[] | undefined;
  className?: string;
}) => {
  const { data: tiers } = api.tier.getAll.useQuery();
  if (!tourneys || !teams) {
    return (
      <div
        className={cn(
          className,
          `grid grid-cols-${tourneys?.length} w-full grid-flow-row text-center [&>*:last-child]:border-none`,
        )}
      >
        {Array.from({ length: tourneys?.length ?? 0 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full flex-col items-center justify-center border-r border-dotted border-gray-400"
          >
            <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-slate-200 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
            <div className="h-4 w-6 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        className,
        `grid w-full grid-flow-row grid-cols-${tourneys.length} text-center [&>*:last-child]:border-none`,
      )}
    >
      {tourneys.map((tournament) => {
        const tier = tiers?.find((t) => t.id === tournament.tierId);
        const team = teams.find((t) => t.tournamentId === tournament.id);
        const isMajor = tier?.name === "Major";
        const isPastEvent = new Date(tournament.endDate) < new Date();
        const didNotMakeCut = team?.position === "CUT";
        const didNotPlay = !team && isPastEvent;
        const isWinner = +(team?.position?.replace("T", "") ?? 0) === 1;

        return (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center border-r border-dotted border-gray-400 font-varela text-xs sm:text-sm md:text-base",
              isMajor && "bg-champ-100",
              didNotPlay && "opacity-40",
              didNotMakeCut && "opacity-60",
            )}
            key={tournament.id}
          >
            <div className={cn("py-1")}>
              <Link href={"/tournament/" + tournament.id}>
                {!tournament.logoUrl ? (
                  <LoadingSpinner className="w-4" />
                ) : (
                  <div className="flex h-8 w-full items-center justify-center xs:h-10 sm:h-12 md:h-14">
                    <Image
                      width={512}
                      height={512}
                      className="w-8 xs:w-10 sm:w-12 md:w-14"
                      src={tournament.logoUrl}
                      alt={tournament.name}
                    />
                  </div>
                )}
              </Link>
              <div
                className={cn(
                  didNotPlay && "text-red-900",
                  didNotMakeCut && "text-gray-600",
                  isWinner && "font-extrabold text-champ-900",
                  "whitespace-nowrap",
                )}
              >
                {renderTournamentResult(team, tournament, isWinner)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main functional component
export function StandingsTourCardInfo({
  tourCard,
  member,
}: {
  tourCard: TourCard;
  member: Member | null | undefined;
}) {
  const { data: allTournaments } = api.tournament.getAll.useQuery();
  const { data: allTiers } = api.tier.getAll.useQuery();
  const { data: allTeams } = api.team.getAll.useQuery();

  const filteredTourneys = getNonPlayoffTournaments(
    allTournaments,
    tourCard.seasonId,
    allTiers,
  );
  const teams = getTeamsForTourCard(allTeams, tourCard.id);

  return (
    <div
      className={cn(
        "col-span-17 w-full border-b border-slate-300 px-2 pb-4 pt-2 font-normal",
        member?.id === tourCard?.memberId &&
          "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
        member?.friends.includes(tourCard.memberId) &&
          "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
      )}
    >
      {/* Player Statistics Header */}
      <div className="grid grid-flow-row grid-cols-5 pt-1.5 text-center">
        {["Wins", "Top Tens", "Cuts Made", "Weekday Avg.", "Weekend Avg."].map((label) => (
          <div
            key={label}
            className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Player Statistics Values */}
      <div className="grid grid-flow-row grid-cols-5 pb-3 text-center">
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.win}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.topTen}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {tourCard.madeCut} / {tourCard.appearances}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {!teams ? (
            <div className="h-4 w-8 animate-pulse rounded bg-slate-300" />
          ) : (
            calculateAverageScore(teams, "weekday")
          )}
        </div>
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {!teams ? (
            <div className="h-4 w-8 animate-pulse rounded bg-slate-300" />
          ) : (
            calculateAverageScore(teams, "weekend")
          )}
        </div>
      </div>

      {/* Tournament History Section */}
      {(filteredTourneys?.length ?? 0) > 10 ? (
        <>
          <TournamentHistoryRow
            tourneys={filteredTourneys?.slice(
              0,
              Math.round(filteredTourneys.length / 2),
            )}
            teams={teams}
            className="border-b"
          />
          <TournamentHistoryRow
            tourneys={filteredTourneys?.slice(
              Math.round(filteredTourneys.length / 2),
              filteredTourneys.length,
            )}
            teams={teams}
          />
        </>
      ) : (
        <TournamentHistoryRow tourneys={filteredTourneys} teams={teams} />
      )}
    </div>
  );
}