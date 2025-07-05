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
    ?.find(
      (t) =>
        t.endDate < new Date() &&
        t.endDate > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    );
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
