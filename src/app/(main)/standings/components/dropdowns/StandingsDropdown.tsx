"use client";

import { cn, formatRank } from "@/src/lib/utils";
import type { Member, Team, Tournament } from "@prisma/client";
import { TournamentLogo } from "@/src/app/_components/OptimizedImage";
import Link from "next/link";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import type { StandingsTourCardInfoProps } from "../../types";
import { api } from "@/src/trpc/react";

export function StandingsTourCardInfo({
  tourCard,
  member,
}: StandingsTourCardInfoProps & { member: Member | null | undefined }) {
  // Get current season for tournaments data
  const { data: currentSeason } = api.season.getCurrent.useQuery();

  // Get tournaments for current season, excluding playoffs
  const { data: tourneys } = api.tournament.getBySeason.useQuery(
    {
      seasonId: currentSeason?.id ?? "",
    },
    {
      enabled: !!currentSeason?.id,
    },
  );

  // Get tiers to filter out playoff tournaments
  const { data: tiers } = api.tier.getCurrent.useQuery();
  const playoffTier = tiers?.find((a) => a.name === "Playoff");

  // Filter out playoff tournaments
  const filteredTourneys = tourneys?.filter(
    (t) => t.tierId !== playoffTier?.id,
  );

  // Get teams for all tournaments to find this player's teams
  const teamsQueries =
    filteredTourneys?.map((tournament) => ({
      tournamentId: tournament.id,
      query: api.team.getByTournament.useQuery({
        tournamentId: tournament.id,
      }),
    })) ?? [];

  // Get all teams associated with this player's tour card across all tournaments
  const teams = teamsQueries.reduce((acc, { query }) => {
    const tournamentTeams = query.data;
    if (Array.isArray(tournamentTeams)) {
      const team = tournamentTeams.find(
        (team) => team.tourCardId === tourCard.id,
      );
      if (team) {
        acc.push(team);
      }
    }
    return acc;
  }, [] as Team[]);

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
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Wins
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Top Tens
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Cuts Made
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Weekday Avg.
        </div>
        <div className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm">
          Weekend Avg.
        </div>
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

        {/* Weekday Average Score */}
        <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
          {!teams ? (
            <div className="h-4 w-8 animate-pulse rounded bg-slate-300" />
          ) : (
            calculateAverageScore(teams, "weekday")
          )}
        </div>

        {/* Weekend Average Score */}
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

function calculateAverageScore(
  teams: Team[],
  type: "weekday" | "weekend",
): number {
  const rounds =
    type === "weekday"
      ? teams.reduce(
          (acc, team) => acc + (team.roundOne ?? 0) + (team.roundTwo ?? 0),
          0,
        )
      : teams.reduce(
          (acc, team) => acc + (team.roundThree ?? 0) + (team.roundFour ?? 0),
          0,
        );

  const roundCount =
    type === "weekday"
      ? teams.filter((t) => t.roundOne).length +
        teams.filter((t) => t.roundTwo).length
      : teams.filter((t) => t.roundThree).length +
        teams.filter((t) => t.roundFour).length;

  return Math.round((rounds / (roundCount || 1)) * 10) / 10;
}

function TournamentHistoryRow({
  tourneys,
  teams,
  className,
}: {
  tourneys: Tournament[] | undefined;
  teams: Team[] | undefined;
  className?: string;
}) {
  // Get tiers for displaying tournament importance
  const { data: tiers } = api.tier.getCurrent.useQuery();
  if (!tourneys || !teams) {
    // Replace the simple loading spinner with a proper skeleton UI
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
            {/* Logo skeleton */}
            <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-slate-200 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />

            {/* Position skeleton */}
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
            <div className={cn("w-full p-1")}>
              {/* Tournament Logo */}
              <Link href={"/tournament/" + tournament.id}>
                {!tournament.logoUrl ? (
                  <LoadingSpinner className="w-4" />
                ) : (
                  <div className="flex h-8 w-full items-center justify-center xs:h-10 sm:h-12 md:h-14">
                    <TournamentLogo
                      fill={true}
                      src={tournament.logoUrl}
                      alt={tournament.name}
                      size="medium"
                    />
                  </div>
                )}
              </Link>

              {/* Tournament Result */}
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
}

function renderTournamentResult(
  team: Team | undefined,
  tournament: Tournament,
  isWinner: boolean,
): JSX.Element | string {
  if (!team) {
    if (new Date(tournament.endDate) > new Date()) {
      return "-"; // Future tournament
    }
    return "DNP"; // Did not participate
  }

  if (team.position === "CUT") {
    return "CUT"; // Cut from tournament
  }

  // Player finished with a position
  return (
    <>
      {team.position}
      <span className={cn("text-2xs", isWinner && "text-xs")}>
        {team.position
          ? formatRank(+team.position.replace("T", "")).slice(-2)
          : ""}
      </span>
    </>
  );
}
