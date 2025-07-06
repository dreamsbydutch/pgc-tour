// Standings page helpers

export function getUserTourCard(tours: any[] | undefined, currentMember: any) {
  return tours
    ?.flatMap((tour) => tour.tourCards)
    .find((card) => card.memberId === currentMember?.id);
}

export function getActiveTour(
  tours: any[] | undefined,
  standingsToggle: string,
) {
  return tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];
}

export function getGoldCutCards(activeTour: any) {
  return activeTour.tourCards.filter(
    (_card: any, index: number) => index < (activeTour.playoffSpots[0] ?? 15),
  );
}

export function getSilverCutCards(activeTour: any) {
  return activeTour.tourCards.filter(
    (_card: any, index: number) =>
      index >= (activeTour.playoffSpots[0] ?? 15) &&
      index <
        (activeTour.playoffSpots[0] ?? 15) + (activeTour.playoffSpots[1] ?? 15),
  );
}

export function getRemainingCards(activeTour: any) {
  return activeTour.tourCards.filter(
    (_card: any, index: number) =>
      index >=
      (activeTour.playoffSpots[0] ?? 15) + (activeTour.playoffSpots[1] ?? 15),
  );
}

export function getGoldTeams(tours: any[]) {
  return tours
    .map((tour) =>
      tour.tourCards.filter(
        (_card: any, index: number) => index < (tour.playoffSpots[0] ?? 15),
      ),
    )
    .flat()
    .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
}

export function getSilverTeams(tours: any[]) {
  return tours
    .map((tour) =>
      tour.tourCards.filter(
        (_card: any, index: number) =>
          index >= (tour.playoffSpots[0] ?? 15) &&
          index < (tour.playoffSpots[0] ?? 15) + (tour.playoffSpots[1] ?? 15),
      ),
    )
    .flat()
    .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
}

export function getPlayoffTier(tiers: any[] | undefined) {
  return tiers?.find((t) => t.name === "Playoff");
}
