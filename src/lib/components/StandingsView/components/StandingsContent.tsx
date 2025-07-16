import type { StandingsContentProps } from "../types";
import { filterTourCardsByTour } from "../utils/standingsHelpers";
import { TourStandings } from "./TourStandings";
import { PlayoffStandings } from "./PlayoffStandings";

/**
 * StandingsContent Component
 *
 * Routes between different standings views based on the selected toggle
 */
export function StandingsContent({
  standingsToggle,
  data,
  friendState,
  onAddFriend,
  onRemoveFriend,
}: StandingsContentProps) {
  const { tours, tiers, tourCards, currentMember } = data;

  // Display playoff standings
  if (standingsToggle === "playoffs") {
    return (
      <PlayoffStandings
        tours={tours}
        tiers={tiers}
        tourCards={tourCards}
        currentMember={currentMember}
        friendState={friendState}
        onAddFriend={onAddFriend}
        onRemoveFriend={onRemoveFriend}
      />
    );
  }

  // Find the selected tour
  const selectedTour = tours.find((tour) => tour.id === standingsToggle);

  if (!selectedTour) {
    return <div className="py-8 text-center text-gray-500">Tour not found</div>;
  }

  // Filter tour cards for the selected tour
  const filteredTourCards = filterTourCardsByTour(tourCards, selectedTour.id);

  return (
    <TourStandings
      tour={selectedTour}
      tourCards={filteredTourCards}
      currentMember={currentMember}
      friendState={friendState}
      onAddFriend={onAddFriend}
      onRemoveFriend={onRemoveFriend}
    />
  );
}
