import { api } from "@/src/trpc/server";
import { Course, Tier, Tournament } from "@prisma/client";
import { cache } from "react";

/**
 * Get current season data with aggressive caching (5 minutes).
 * This replaces the seasonal store for server-side operations.
 */
export const getCurrentSeasonData = cache(async () => {
  const currentSeason = await api.season.getCurrent();

  if (!currentSeason) {
    return {
      currentSeason: null,
      tournaments: [],
      tours: [],
      tourCards: [],
      tiers: [],
    };
  }

  // Fetch all current season data in parallel for efficiency
  const [tournaments, tours, tourCards, tiers] = await Promise.all([
    api.tournament.getBySeason({ seasonId: currentSeason.id }),
    api.tour.getBySeason({ seasonId: currentSeason.id }),
    api.tourCard.getBySeason({ seasonId: currentSeason.id }),
    api.tier.getBySeason({ seasonId: currentSeason.id }),
  ]);

  return {
    currentSeason,
    tournaments: tournaments.map((t) => ({
      ...t,
      startDate: new Date(t.startDate),
      endDate: new Date(t.endDate),
    })),
    tours,
    tourCards,
    tiers,
  };
});

export async function getCurrentSchedule() {
  const tournaments = await api.tournament.getCurrentSchedule();

  return tournaments
    .map((t) => {
      return {
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      };
    })
    .sort((a, b) => {
      return a.startDate.getTime() - b.startDate.getTime();
    });
}
export async function getSeasonSchedule({
  seasonId,
  year,
}: {
  seasonId?: string;
  year?: number;
}) {
  const season = await api.season.getByYear({
    year: year ?? new Date().getFullYear(),
  });
  const tournaments = await api.tournament.getSeasonSchedule({
    seasonId: seasonId ?? season?.id ?? "",
  });

  return tournaments.map((t) => {
    return {
      ...t,
      startDate: new Date(t.startDate),
      endDate: new Date(t.endDate),
    };
  });
}

export async function getLatestTournament() {
  const tournaments = await api.tournament.getCurrentSchedule();
  const lastTournament = tournaments
    ?.map((t) => {
      return {
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      };
    })
    ?.find(
      (t) =>
        t.endDate < new Date() &&
        t.endDate > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    );
  return lastTournament;
}
export async function getCurrentTournament() {
  const tournaments = await api.tournament.getCurrentSchedule();
  const currentTournament = tournaments
    ?.map((t) => {
      return {
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      };
    })
    ?.find((t) => t.startDate < new Date() && t.endDate > new Date());
  return currentTournament;
}
