import { api } from "@/src/trpc/server";
import { Course, Tier, Tournament } from "@prisma/client";

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