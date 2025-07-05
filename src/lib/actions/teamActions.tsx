import { api } from "@/src/trpc/server";
import { getLatestTournament } from "./tournamentActions";

export async function getLatestChampions() {
  const lastTournament = await getLatestTournament();
  const tours = await api.tour.getBySeason({
    seasonId: lastTournament?.seasonId ?? "",
  });
  const tourCards = await api.tourCard.getBySeason({
    seasonId: lastTournament?.seasonId ?? "",
  });
  const teams = await api.team.getByTournament({
    tournamentId: lastTournament?.id ?? "",
  });
  const golfers = await api.golfer.getByTournament({
    tournamentId: lastTournament?.id ?? "",
  });
  if (!lastTournament || !tours || !tourCards || !teams) {
    return { tournament: undefined, champs: [] };
  }
  const champs =
    teams
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
          golfers:
            golfers
              .filter((golfer) => team.golferIds.includes(golfer.apiId))
              .sort((a, b) => {
                // Define positions that should be at the end
                const endPositions = ["CUT", "WD", "DQ"];

                const aIsEndPosition = endPositions.includes(a.position ?? "");
                const bIsEndPosition = endPositions.includes(b.position ?? "");

                // If one is an end position and the other isn't, end position goes last
                if (aIsEndPosition && !bIsEndPosition) return 1;
                if (!aIsEndPosition && bIsEndPosition) return -1;

                // If both are end positions, sort by position type (CUT, WD, DQ)
                if (aIsEndPosition && bIsEndPosition) {
                  return (
                    endPositions.indexOf(a.position ?? "") -
                    endPositions.indexOf(b.position ?? "")
                  );
                }

                // If neither are end positions, sort by score as normal
                return (a.score ?? 0) - (b.score ?? 0);
              }) ?? [],
        };
      })
      .filter((a) => a.tour !== undefined && a.tourCard !== undefined) ?? [];
  return {
    tournament: lastTournament,
    champs,
  };
}
