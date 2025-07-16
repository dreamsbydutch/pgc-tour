import { groupTourStandings } from "../utils/standingsHelpers";
import { StandingsTableHeader } from "./StandingsTableHeader";
import { StandingsListing } from "./StandingsListing";
import type { TourStandingsProps } from "../types";

/**
 * TourStandings Component
 *
 * Displays standings for a specific tour with gold/silver cut lines
 */
export function TourStandings({
  tour,
  tourCards,
  currentMember,
  friendState,
  onAddFriend,
  onRemoveFriend,
}: TourStandingsProps) {
  if (!tour || !tourCards?.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No standings data available
      </div>
    );
  }

  const { goldCutCards, silverCutCards, remainingCards } =
    groupTourStandings(tourCards);

  return (
    <div className="mx-auto px-1">
      <StandingsTableHeader variant="regular" />

      {/* Gold Playoff Qualifiers */}
      {goldCutCards.map((tourCard) => (
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

      {/* Silver Playoff Qualifiers */}
      {silverCutCards.map((tourCard) => (
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
      {remainingCards.map((tourCard) => (
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
