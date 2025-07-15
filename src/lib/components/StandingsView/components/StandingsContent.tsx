import type { TourCard, Tour, Tier, Member } from "@prisma/client";
import { TourStandings } from "./TourStandings";
import { PlayoffStandings } from "./PlayoffStandings";

export interface StandingsContentProps {
  standingsToggle: string;
  tours: Tour[];
  tiers: Tier[] | null;
  tourCards?: TourCard[] | null;
  displayedTour: Tour | undefined;
  currentMember?: Member | null;
  friendChangingIds?: Set<string>;
  onAddFriend?: (memberId: string) => Promise<void>;
  onRemoveFriend?: (memberId: string) => Promise<void>;
}

export function StandingsContent({
  standingsToggle,
  tours,
  tiers,
  tourCards,
  displayedTour,
  currentMember,
  friendChangingIds,
  onAddFriend,
  onRemoveFriend,
}: StandingsContentProps) {
  if (standingsToggle === "playoffs") {
    return (
      <PlayoffStandings
        tours={tours}
        tiers={tiers}
        tourCards={tourCards}
        currentMember={currentMember}
        friendChangingIds={friendChangingIds}
        onAddFriend={onAddFriend}
        onRemoveFriend={onRemoveFriend}
      />
    );
  }

  return (
    <TourStandings
      activeTour={displayedTour}
      tourCards={tourCards?.filter((a) => a.tourId === displayedTour?.id)}
      currentMember={currentMember}
      friendChangingIds={friendChangingIds}
      onAddFriend={onAddFriend}
      onRemoveFriend={onRemoveFriend}
    />
  );
}
