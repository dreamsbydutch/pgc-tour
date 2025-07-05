import { useSeasonalStore } from "../store/seasonalStore";

export function useCurrentTourCards() {
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const tours = useSeasonalStore((state) => state.tours);
  const season = useSeasonalStore((state) => state.season);

  const currentTourCards = tourCards?.map((tc) => {
    const tour = tours?.find((t) => t.id === tc.tourId);
    if (!tour || !season) return null;
    return {
      ...tc,
      tour,
      season,
    };
  });

  return currentTourCards?.filter((tc) => tc !== null) || [];
}
