import type { StandingsContentProps } from "../utils/types";
import { filterTourCardsByTour } from "../utils/standings-utils";
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
  friendsOnly,
  setFriendsOnly,
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
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={!data?.currentMember}
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
  const filteredTourCards = filterTourCardsByTour(
    tourCards,
    selectedTour.id,
  );

  return (
    <TourStandings
      tour={selectedTour}
      tourCards={filteredTourCards}
      currentMember={currentMember}
      friendState={friendState}
      friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={!data?.currentMember}
      onAddFriend={onAddFriend}
      onRemoveFriend={onRemoveFriend}
    />
  );
}
