import { useSeasonalStore } from "../store/seasonalStore";

export function useCurrentSeason() {
  const seasons = useSeasonalStore((state) => state.season);
  return seasons;
}
