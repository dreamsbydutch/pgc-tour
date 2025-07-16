import type {
  TourCard,
  Tour,
  Tier,
  Member,
  Team,
  Tournament,
} from "@prisma/client";

// Extended types with computed properties
export interface ExtendedTourCard extends TourCard {
  pastPoints?: number;
  posChange?: number;
  posChangePO?: number;
}

export interface TourWithCards extends Tour {
  tourCards?: ExtendedTourCard[];
}

export interface StandingsData {
  tours: Tour[];
  tiers: Tier[];
  tourCards: ExtendedTourCard[];
  currentTourCard: ExtendedTourCard | null;
  currentMember: Member | null;
  teams: Team[];
  tournaments: Tournament[];
  seasonId: string;
}

export interface StandingsState {
  data: StandingsData | null;
  isLoading: boolean;
  error: Error | null;
}

export interface FriendManagementState {
  friendChangingIds: Set<string>;
  isUpdating: boolean;
}

export interface StandingsViewProps {
  initialTourId?: string;
}

// Component prop types
export interface StandingsContentProps {
  standingsToggle: string;
  data: StandingsData;
  friendState: FriendManagementState;
  onAddFriend: (memberId: string) => Promise<void>;
  onRemoveFriend: (memberId: string) => Promise<void>;
}

export interface TourStandingsProps {
  tour: Tour;
  tourCards: ExtendedTourCard[];
  currentMember: Member | null;
  friendState: FriendManagementState;
  onAddFriend: (memberId: string) => Promise<void>;
  onRemoveFriend: (memberId: string) => Promise<void>;
}

export interface PlayoffStandingsProps {
  tours: Tour[];
  tiers: Tier[];
  tourCards: ExtendedTourCard[];
  currentMember: Member | null;
  friendState: FriendManagementState;
  onAddFriend: (memberId: string) => Promise<void>;
  onRemoveFriend: (memberId: string) => Promise<void>;
}

export interface StandingsListingProps {
  tourCard: ExtendedTourCard;
  variant: "regular" | "playoff" | "bumped";
  currentMember?: Member | null;
  isFriendChanging?: boolean;
  onAddFriend?: (memberId: string) => void;
  onRemoveFriend?: (memberId: string) => void;
  // Additional props for playoff variant
  teams?: ExtendedTourCard[];
  strokes?: number[];
  tour?: Tour;
}

// Helper function return types
export interface StandingsGroups {
  goldCutCards: ExtendedTourCard[];
  silverCutCards: ExtendedTourCard[];
  remainingCards: ExtendedTourCard[];
}

export interface PlayoffGroups {
  goldTeams: ExtendedTourCard[];
  silverTeams: ExtendedTourCard[];
  bumpedTeams: ExtendedTourCard[];
}
