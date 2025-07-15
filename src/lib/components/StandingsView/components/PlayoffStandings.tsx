import type { TourCard, Tour, Tier, Member } from "@prisma/client";
import { parsePosition } from "../utils/standingsHelpers";
import { StandingsTableHeader } from "./StandingsTableHeader";
import { StandingsListing } from "./StandingsListing";

export interface PlayoffStandingsProps {
  tours: Tour[];
  tourCards?: TourCard[] | null;
  tiers: Tier[] | null;
  currentMember?: Member | null;
  friendChangingIds?: Set<string>;
  onAddFriend?: (memberId: string) => Promise<void>;
  onRemoveFriend?: (memberId: string) => Promise<void>;
}

export function PlayoffStandings({
  tours,
  tourCards,
  tiers,
  currentMember,
  friendChangingIds,
  onAddFriend,
  onRemoveFriend,
}: PlayoffStandingsProps) {
  const goldTeams = tourCards
    ? tourCards.filter((card) => parsePosition(card.position) <= 15)
    : [];
  const silverTeams = tourCards
    ? tourCards.filter(
        (card) =>
          parsePosition(card.position) <= 35 &&
          parsePosition(card.position) > 15,
      )
    : [];
  const playoffTier = tiers?.find((t) => t.name === "Playoff");

  return (
    <div className="mx-auto px-1">
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
          isFriendChanging={friendChangingIds?.has(tourCard.memberId)}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}

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
          isFriendChanging={friendChangingIds?.has(tourCard.memberId)}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
      ))}
    </div>
  );
}
