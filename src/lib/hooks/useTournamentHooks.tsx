import { useSeasonalStore } from "../store/seasonalStore";

export function useLastTournament() {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const lastTournament = tournaments
    ?.map((t) => {
      return {
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      };
    })
    ?.filter((t) => t.endDate < new Date()) // Only past tournaments
    ?.sort((a, b) => b.endDate.getTime() - a.endDate.getTime())?.[0]; // Sort by most recent end date // Get the most recent one
  return lastTournament;
}
export function useCurrentTournament() {
  const tournaments = useSeasonalStore((state) => state.tournaments);
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
export function useNextTournament() {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const nextTournament = tournaments
    ?.map((t) => {
      return {
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      };
    })
    ?.find((t) => t.startDate > new Date());
  return nextTournament;
}
