/**
 * TourStandings - Displays standings for a specific tour
 *
 * This component renders the regular season standings for a tour,
 * showing tour cards grouped by playoff qualification status:
 * - Gold playoff qualifiers (positions 1-15)
 * - Silver playoff qualifiers (positions 16-35)
 * - Remaining players (positions 36+)
 *
 * It includes visual cut lines to clearly separate the different groups.
 *
 * @param tour - Tour information to display
 * @param tourCards - Tour cards to show in standings
 * @param currentMember - Current user's member data
 * @param friendState - Friend management state
 * @param onAddFriend - Function to add a friend
 * @param onRemoveFriend - Function to remove a friend
 */

import { groupTourStandings } from "../utils/standings-utils";
import { StandingsTableHeader } from "./TableComponents";
import { StandingsListing } from "./ListingComponents";
import type { TourStandingsProps, ExtendedTourCard } from "../utils/types";

/**
 * Tour Standings Component
 *
 * Renders a tour's standings with playoff cut line indicators.
 * Handles empty states and groups players by qualification status.
 */
export function TourStandings({
  tour,
  tourCards,
  currentMember,
  friendState,
  onAddFriend,
  onRemoveFriend,
}: TourStandingsProps) {
  // Handle empty or loading states
  if (!tour || !tourCards?.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No standings data available for {tour?.name || "this tour"}
      </div>
    );
  }

  // Group tour cards by playoff qualification status
  const { goldCutCards, silverCutCards, remainingCards } =
    groupTourStandings(tourCards);

  return (
    <div className="mx-auto px-1">
      <StandingsTableHeader variant="regular" />

      {/* Gold Playoff Qualifiers (Positions 1-15) */}
      {goldCutCards.map((tourCard: ExtendedTourCard) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
          currentMember={currentMember}
          isFriendChanging={friendState.friendChangingIds.has(
            tourCard.memberId,
          )}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}

      <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
        GOLD PLAYOFF CUT LINE
      </div>

      {/* Silver Playoff Qualifiers (Positions 16-35) */}
      {silverCutCards.map((tourCard: ExtendedTourCard) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
          currentMember={currentMember}
          isFriendChanging={friendState.friendChangingIds.has(
            tourCard.memberId,
          )}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}

      <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
        SILVER PLAYOFF CUT LINE
      </div>

      {/* Remaining Players */}
      {/* Remaining Players (Positions 36+) */}
      {remainingCards.map((tourCard: ExtendedTourCard) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
          currentMember={currentMember}
          isFriendChanging={friendState.friendChangingIds.has(
            tourCard.memberId,
          )}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}
    </div>
  );
}
