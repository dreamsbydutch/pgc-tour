/**
 * Tour Card Info Components
 *
 * Consolidates all tour card info related components (hook, pure components, container)
 * while maintaining clear separation between data fetching and presentation.
 */

import Link from "next/link";
import Image from "next/image";
import { cn, formatRank } from "@pgc-utils";
import { api } from "@pgc-trpcClient";
import type { TourCard, Member, Tournament, Team } from "@prisma/client";
import { LoadingSpinner } from "src/lib/components/functional/ui";

// ============================================================================
// CUSTOM HOOK FOR DATA FETCHING
// ============================================================================

/**
 * Pure helper functions
 */
export const getNonPlayoffTournaments = (
  allTournaments: Tournament[] | undefined,
  seasonId: string,
  allTiers: { id: string; name: string }[] | undefined,
): Tournament[] | undefined =>
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

export const getTeamsForTourCard = (
  allTeams: Team[] | undefined,
  tourCardId: string,
): Team[] | undefined =>
  allTeams
    ? allTeams.filter((team) => team.tourCardId === tourCardId)
    : undefined;

export const calculateAverageScore = (
  teams: Team[] = [],
  type: "weekday" | "weekend",
): number => {
  const rounds =
    type === "weekday"
      ? teams.reduce((acc, t) => acc + (t.roundOne ?? 0) + (t.roundTwo ?? 0), 0)
      : teams.reduce(
          (acc, t) => acc + (t.roundThree ?? 0) + (t.roundFour ?? 0),
          0,
        );

  const roundCount =
    type === "weekday"
      ? teams.filter((t) => t.roundOne).length +
        teams.filter((t) => t.roundTwo).length
      : teams.filter((t) => t.roundThree).length +
        teams.filter((t) => t.roundFour).length;

  return Math.round((rounds / (roundCount || 1)) * 10) / 10;
};

/**
 * Interface for the hook return value
 */
export interface UseTourCardInfoData {
  tournaments: Tournament[] | undefined;
  teams: Team[] | undefined;
  tiers: { id: string; name: string }[] | undefined;
  isLoading: boolean;
  error: unknown;
}

/**
 * Custom hook for fetching tour card info data
 */
export const useTourCardInfoData = (
  tourCard: TourCard,
): UseTourCardInfoData => {
  const {
    data: allTournaments,
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = api.tournament.getAll.useQuery();

  const {
    data: allTiers,
    isLoading: tiersLoading,
    error: tiersError,
  } = api.tier.getAll.useQuery();

  const {
    data: allTeams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getAll.useQuery();

  const filteredTournaments = getNonPlayoffTournaments(
    allTournaments,
    tourCard.seasonId,
    allTiers,
  );

  const teams = getTeamsForTourCard(allTeams, tourCard.id);

  return {
    tournaments: filteredTournaments,
    teams,
    tiers: allTiers,
    isLoading: tournamentsLoading || tiersLoading || teamsLoading,
    error: tournamentsError ?? tiersError ?? teamsError,
  };
};

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

/**
 * Pure helper: render tournament result
 */
export const renderTournamentResult = (
  team: Team | undefined,
  tournament: Tournament,
  isWinner: boolean,
): JSX.Element | string => {
  if (new Date(tournament.endDate) > new Date()) return "-";
  if (!team) {
    return "DNP";
  }
  if (team.position === "CUT") return "CUT";
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
};

// ============================================================================
// PURE PRESENTATION COMPONENTS
// ============================================================================

/**
 * Player Statistics Component
 */
interface PlayerStatsProps {
  tourCard: TourCard;
  teams: Team[] | undefined;
  isLoading: boolean;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  tourCard,
  teams,
  isLoading,
}) => (
  <>
    {/* Player Statistics Header */}
    <div className="grid grid-flow-row grid-cols-5 pt-1.5 text-center">
      {["Wins", "Top Tens", "Cuts Made", "Weekday Avg.", "Weekend Avg."].map(
        (label) => (
          <div
            key={label}
            className="place-self-center font-varela text-3xs font-bold 2xs:text-2xs sm:text-sm"
          >
            {label}
          </div>
        ),
      )}
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
        {isLoading ? (
          <div className="h-4 w-8 animate-pulse rounded bg-slate-300" />
        ) : (
          calculateAverageScore(teams, "weekday")
        )}
      </div>
      <div className="place-self-center font-varela text-xs 2xs:text-sm sm:text-base md:text-lg">
        {isLoading ? (
          <div className="h-4 w-8 animate-pulse rounded bg-slate-300" />
        ) : (
          calculateAverageScore(teams, "weekend")
        )}
      </div>
    </div>
  </>
);

/**
 * Tournament History Row Component
 */
interface TournamentHistoryRowProps {
  tournaments: Tournament[] | undefined;
  teams: Team[] | undefined;
  tiers: { id: string; name: string }[] | undefined;
  className?: string;
  isLoading: boolean;
}

export const TournamentHistoryRow: React.FC<TournamentHistoryRowProps> = ({
  tournaments,
  teams,
  tiers,
  className,
  isLoading,
}) => {
  if (isLoading || !tournaments || !teams) {
    return (
      <div
        className={cn(
          className,
          `grid grid-cols-${tournaments?.length ?? 4} w-full grid-flow-row text-center [&>*:last-child]:border-none`,
        )}
      >
        {Array.from({ length: tournaments?.length ?? 4 }).map((_, i) => (
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
        `grid w-full grid-flow-row grid-cols-${tournaments.length} text-center [&>*:last-child]:border-none`,
      )}
    >
      {tournaments.map((tournament) => {
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

/**
 * Tournament History Section Component
 */
interface TournamentHistorySectionProps {
  tournaments: Tournament[] | undefined;
  teams: Team[] | undefined;
  tiers: { id: string; name: string }[] | undefined;
  isLoading: boolean;
}

export const TournamentHistorySection: React.FC<
  TournamentHistorySectionProps
> = ({ tournaments, teams, tiers, isLoading }) => {
  const tournamentCount = tournaments?.length ?? 0;

  if (tournamentCount > 10) {
    const midPoint = Math.round(tournamentCount / 2);
    return (
      <>
        <TournamentHistoryRow
          tournaments={tournaments?.slice(0, midPoint)}
          teams={teams}
          tiers={tiers}
          className="border-b"
          isLoading={isLoading}
        />
        <TournamentHistoryRow
          tournaments={tournaments?.slice(midPoint)}
          teams={teams}
          tiers={tiers}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <TournamentHistoryRow
      tournaments={tournaments}
      teams={teams}
      tiers={tiers}
      isLoading={isLoading}
    />
  );
};

// ============================================================================
// MAIN CONTAINER COMPONENT
// ============================================================================

/**
 * StandingsTourCardInfo Container Component
 *
 * Main component that orchestrates data fetching and presentation
 */
export function StandingsTourCardInfo({
  tourCard,
  member,
}: {
  tourCard: TourCard;
  member: Member | null | undefined;
}) {
  const { tournaments, teams, tiers, isLoading, error } =
    useTourCardInfoData(tourCard);

  // Handle error state
  if (error) {
    return (
      <div className="col-span-17 w-full border-b border-slate-300 px-2 pb-4 pt-2 text-center text-red-500">
        Failed to load player information
      </div>
    );
  }

  return (
    <div
      className={cn(
        "col-span-17 w-full border-b border-slate-300 px-2 pb-4 pt-2 font-normal",
        member?.id === tourCard?.memberId &&
          "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
        member?.friends?.includes(tourCard.memberId) &&
          "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
      )}
    >
      {/* Player Statistics Section */}
      <PlayerStats tourCard={tourCard} teams={teams} isLoading={isLoading} />

      {/* Tournament History Section */}
      <TournamentHistorySection
        tournaments={tournaments}
        teams={teams}
        tiers={tiers}
        isLoading={isLoading}
      />
    </div>
  );
}
