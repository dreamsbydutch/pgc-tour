/**
 * HomePageListings - Type definitions
 */

// =============================================================================
// BASE TYPES - Shared base types
// =============================================================================

/**
 * Base tournament information
 */
export interface BaseTournament {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: Date;
  seasonId: string;
  currentRound: number | null;
}

/**
 * Base tour card information
 */
export interface BaseTourCard {
  id: string;
  displayName: string;
  memberId: string;
  tourId: string;
}

/**
 * Base member information
 */
export interface BaseMember {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string;
}

/**
 * Base team information
 */
export interface BaseTeam {
  id: number;
  tournamentId: string;
  tourCardId: string;
  score: number | null;
  position: string | null;
  thru: number | null;
}

// =============================================================================
// API TYPES - Types for data coming from APIs
// =============================================================================

/**
 * Type for team data from getByTournament API
 */
export interface TeamFromTournamentAPI extends BaseTeam {
  tourCard: BaseTourCard & {
    member: BaseMember;
  };
}

/**
 * Type for team data from getByMember API
 */
export interface TeamFromMemberAPI extends BaseTeam {
  tournament: BaseTournament;
  tourCard: BaseTourCard;
}

/**
 * Type for champion data from getAllChampions API
 */
export interface ChampionFromAPI extends BaseTeam {
  tournament: BaseTournament;
  tourCard: Pick<BaseTourCard, "memberId">;
}

/**
 * Type for tournament data from store
 */
export interface TournamentFromStore extends BaseTournament {
  endDate: Date;
  currentRound: number | null;
  livePlay: boolean | null;
}

/**
 * Type for tour data from store
 */
export interface TourFromStore {
  id: string;
  logoUrl: string | null;
  shortForm: string;
  name: string;
}

/**
 * Type for member data from store
 */
export interface MemberFromStore extends BaseMember {
  friends: string[];
}

// =============================================================================
// COMPONENT TYPES - Types for data used by components
// =============================================================================

export interface HomePageListingsUser {
  id: string;
  friends: string[];
}

export interface HomePageListingsTour {
  id: string;
  logoUrl: string | null;
  shortForm: string;
  seasonId: string;
}

export interface HomePageListingsChampion {
  id: number;
  tourCard: Pick<BaseTourCard, "memberId">;
  tournament: Pick<
    BaseTournament,
    "name" | "seasonId" | "logoUrl" | "startDate" | "currentRound"
  >;
}

export interface HomePageListingsTeam {
  id: number | string;
  memberId: string;
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
}

export interface HomePageListingsTourCard {
  id: string;
  tourId: string;
  points: number;
  earnings: number;
  position: string | null;
  displayName: string;
  memberId: string;
}

export interface HomePageListingsLeaderboardTeam {
  id: string;
  tourCard: Pick<BaseTourCard, "displayName" | "memberId">;
  position: string;
  score: number;
  thru: number;
}

export interface HomePageListingsLeaderboardTour {
  id: string;
  seasonId: string;
  logoUrl: string | null;
  shortForm: string;
  teams: HomePageListingsLeaderboardTeam[];
}

export interface HomePageListingsTournament {
  id: string;
  seasonId: string;
  logoUrl: string | null;
  name: string;
  startDate: Date;
  endDate: Date;
  currentRound: number | null;
  course: {
    name: string;
    location: string;
    par: number;
    front: number;
    back: number;
  };
  tier: {
    name: string;
    points: number[];
    payouts: number[];
  };
}

export type HomePageListingsViewType = "standings" | "leaderboard";

// =============================================================================
// COMPONENT PROPS TYPES - Types for component props
// =============================================================================

/**
 * Base props that all view components share
 */
export interface BaseHomePageListingsProps {
  self: HomePageListingsUser;
  champions?: HomePageListingsChampion[] | null;
}

export interface HomePageListingsStandingsProps
  extends BaseHomePageListingsProps {
  tours: HomePageListingsTour[];
  tourCards: HomePageListingsTourCard[];
}

export interface HomePageListingsLeaderboardProps
  extends BaseHomePageListingsProps {
  tours: HomePageListingsLeaderboardTour[];
  currentTournament: HomePageListingsTournament | undefined;
  allTournaments: HomePageListingsTournament[];
}

export interface HomePageListingsContainerProps {
  initialView?: HomePageListingsViewType;
}

export interface HomePageListingsToggleProps {
  activeView: HomePageListingsViewType;
  onViewChange: (view: HomePageListingsViewType) => void;
}
