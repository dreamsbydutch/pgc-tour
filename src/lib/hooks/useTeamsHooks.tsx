import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";
import { sortGolfers } from "../utils";

export function useLatestChampions() {
  const lastTournament = useLastTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  if (!lastTournament || !tours || !tourCards) {
    return { tournament: undefined, champs: [] };
  }
  const champs =
    lastTournament?.teams
      .filter((team) => team.position === "1" || team.position === "T1")
      .map((team) => {
        const tourCard = tourCards?.find((card) => card.id === team.tourCardId);
        const tour = tours?.find((tour) => tour.id === tourCard?.tourId);
        if (!tour || !tourCard) {
          return {
            ...team,
            tour: undefined,
            tourCard: undefined,
            golfers: [],
          };
        }
        return {
          ...team,
          tour,
          tourCard,
          golfers: sortGolfers(
            lastTournament?.golfers.filter((golfer) =>
              team.golferIds.includes(golfer.apiId),
            ) ?? [],
          ),
        };
      })
      .filter((a) => a.tour !== undefined && a.tourCard !== undefined) ?? [];
  return {
    tournament: lastTournament,
    champs,
  };
}

export function useCurrentLeaderboard() {
  const currentTournament = useLastTournament();
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const { data: teams } = api.team.getByTournament.useQuery(
    { tournamentId: currentTournament?.id ?? "" },
    {
      staleTime: 1000 * 60 * 1, // Consider data stale after 1 minute
      gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
      refetchInterval: 1000 * 60 * 2, // ✅ Refetch every 2 minutes
      refetchIntervalInBackground: true, // ✅ Continue refetching when tab is not active
      refetchOnWindowFocus: true, // ✅ Refetch when user focuses the tab
      retry: 3, // Retry failed requests 3 times
    },
  );
  return {
    tourney: currentTournament,
    teamsByTour: tours?.map((tour) => {
      return teams
        ?.filter((a) => a.tourCard.tourId === tour.id)
        .map((team) => {
          const tourCard = tourCards?.find(
            (card) => card.id === team.tourCardId,
          );
          const tour = tours?.find((tour) => tour.id === tourCard?.tourId);
          if (!tour || !tourCard) {
            return {
              ...team,
              tour: undefined,
              tourCard: undefined,
              golfers: [],
            };
          }
          return {
            ...team,
            tour,
            tourCard,
            golfers: sortGolfers(
              currentTournament?.golfers.filter((golfer) =>
                team.golferIds.includes(golfer.apiId),
              ) ?? [],
            ),
          };
        });
    }),
  };
}
