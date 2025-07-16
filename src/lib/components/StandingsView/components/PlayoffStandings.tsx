import { groupPlayoffStandings } from "../utils/standingsHelpers";
import { StandingsTableHeader } from "./StandingsTableHeader";
import { StandingsListing } from "./StandingsListing";
import type { PlayoffStandingsProps } from "../types";

/**
 * PlayoffStandings Component
 *
 * Displays playoff standings with gold, silver, and bumped sections
 */
export function PlayoffStandings({
  tours,
  tourCards,
  tiers,
  currentMember,
  friendState,
  onAddFriend,
  onRemoveFriend,
}: PlayoffStandingsProps) {
  if (!tourCards?.length) {
    return (
      <div className="py-8 text-center text-gray-500">
        No playoff standings data available
      </div>
    );
  }

  const { goldTeams, silverTeams, bumpedTeams } =
    groupPlayoffStandings(tourCards);
  const playoffTier = tiers.find((t) => t.name === "Playoff");

  return (
    <div className="mx-auto px-1">
      {/* Gold Playoff Section */}
      <StandingsTableHeader
        variant="gold"
        tier={{
          id: "gold",
          name: "Gold",
          payouts: playoffTier?.payouts.slice(0, 30) ?? [],
          points: playoffTier?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {goldTeams.map((tourCard) => (
        <StandingsListing
          variant="playoff"
          key={tourCard.id}
          tourCard={tourCard}
          teams={goldTeams}
          strokes={playoffTier?.points.slice(0, 30) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
          currentMember={currentMember}
          isFriendChanging={friendState.friendChangingIds.has(
            tourCard.memberId,
          )}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}

      {/* Silver Playoff Section */}
      <StandingsTableHeader
        variant="silver"
        tier={{
          id: "silver",
          name: "Silver",
          payouts: playoffTier?.payouts.slice(75, 115) ?? [],
          points: playoffTier?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {silverTeams.map((tourCard) => (
        <StandingsListing
          variant="playoff"
          key={tourCard.id}
          tourCard={tourCard}
          teams={silverTeams}
          strokes={playoffTier?.points.slice(0, 40) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
          currentMember={currentMember}
          isFriendChanging={friendState.friendChangingIds.has(
            tourCard.memberId,
          )}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}

      {/* Bumped Section */}
      <StandingsTableHeader variant="bumped" />

      {bumpedTeams.map((tourCard) => (
        <StandingsListing
          variant="bumped"
          key={tourCard.id}
          tourCard={tourCard}
          teams={bumpedTeams}
          strokes={[]}
          tour={tours.find((t) => t.id === tourCard.tourId)}
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
