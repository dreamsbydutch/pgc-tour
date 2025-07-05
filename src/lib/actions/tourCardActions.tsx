import { api } from "@/src/trpc/server";

export async function getCurrentStandings() {
  const season = await api.season.getCurrent();
  const tourCards = await api.tourCard.getBySeason({
    seasonId: season?.id ?? "",
  });
  const tours = await api.tour.getBySeason({ seasonId: season?.id ?? "" });
  return tours.map((tour) => {
    const splitTourCards = tourCards.filter((card) => card.tourId === tour.id);
    return {
      ...tour,
      tourCards: splitTourCards.sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0),
      ),
    };
  });
}
