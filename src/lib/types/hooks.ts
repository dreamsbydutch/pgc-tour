/**
 * @fileoverview TypeScript types for hooks return values
 * Provides type safety and inference for all hook responses
 */

import type {
  Tournament,
  Tour,
  TourCard,
  Member,
  Team,
  Golfer,
  Tier,
  Season,
  Course,
} from "@prisma/client";

// Base hook status types
export type HookStatus = "loading" | "error" | "success" | "empty";
export type DataSource = "store" | "api" | "season" | "none" | "error";
export type TournamentStatus = "upcoming" | "current" | "completed";

// Enhanced types with relations
export type EnhancedTournament = Tournament & {
  course: Course;
  teams: Team[];
  golfers: Golfer[];
};

export type EnhancedTeam = Team & {
  tour: Tour;
  tourCard: TourCard & { member: Member };
  golfers: Golfer[];
};

export type TeamsByTour = {
  tour: Tour;
  teams: EnhancedTeam[];
  teamCount: number;
};

// Tournament leaderboard hook return type
export interface TournamentLeaderboardResult {
  tournament: EnhancedTournament | undefined;
  teamsByTour: TeamsByTour[];
  error: string | null;
  isLoading: boolean;
  status: HookStatus;
  dataSource: DataSource;
  tournamentStatus?: TournamentStatus;
  totalTeams?: number;
  lastUpdated?: Date;
  message?: string;
}

// Member history types
export type MemberTeamHistory = {
  team: Team;
  tournament: EnhancedTournament;
  tour: Tour;
  tourCard: TourCard & { member: Member };
  tier: Tier;
  golfers: Golfer[];
  tournamentStatus: TournamentStatus;
};

export type MissedTournament = {
  tournament: EnhancedTournament;
  tier: Tier;
  eligibleTours: Tour[];
  reason: string;
  tournamentStatus: TournamentStatus;
};

export type APISeasonTeamData = {
  season: Season;
  teams: MemberTeamHistory[];
  tourCards: TourCard[];
};

export type APIAllTimeStatistics = {
  totalSeasons: number;
  totalTournaments: number;
  totalTeams: number;
  wins: number;
  topTens: number;
  cuts: number;
  averageScore: number;
  bestFinish: number | null;
  totalEarnings?: number;
  totalPoints?: number;
};

export type MemberHistoryStatistics = {
  totalTournaments: number;
  participated: number;
  missed: number;
  participationRate: number;
};

export interface MemberHistoryResult {
  teams:
    | MemberTeamHistory[]
    | {
        participatedTeams: MemberTeamHistory[];
        missedTournaments: MissedTournament[];
      };
  statistics?: MemberHistoryStatistics;
  memberTourCards?: (TourCard & { member: Member })[];
  member?: Member;
  teamsBySeason?: APISeasonTeamData[]; // For API responses
  allTimeStatistics?: APIAllTimeStatistics; // For API responses
  error: string | null;
  isLoading: boolean;
  status: HookStatus;
  dataSource: DataSource;
  lastUpdated?: Date;
}

// Tour card history types
export type TourCardTeamHistory = {
  team: Team;
  tournament: EnhancedTournament;
  tour: Tour;
  tourCard: TourCard;
  tier: Tier;
  golfers: Golfer[];
  tournamentStatus: TournamentStatus;
};

export type TourCardStatistics = {
  totalTeams: number;
  wins: number;
  topTens: number;
  cuts: number;
  averageScore: number;
  bestFinish: number | null;
};

export interface TourCardHistoryResult {
  teams: TourCardTeamHistory[];
  statistics?: TourCardStatistics;
  tourCard?: TourCard;
  tour?: Tour;
  error: string | null;
  isLoading: boolean;
  status: HookStatus;
  dataSource: DataSource;
  lastUpdated?: Date;
}

// Playoffs types
export type PlayoffTeam = {
  tourCard: TourCard & { member: Member };
  teams: Team[];
  totalPoints: number;
  totalEarnings: number;
  wins: number;
  topTens: number;
  cuts: number;
  appearances: number;
  playoffPosition: number;
  playoffType: "gold" | "silver";
};

export type PlayoffsByTour = {
  tour: Tour;
  goldTeams: PlayoffTeam[];
  silverTeams: PlayoffTeam[];
  totalTeams: number;
  playoffSpots: number[];
};

export interface SeasonPlayoffsResult {
  playoffsByTour: PlayoffsByTour[];
  totalGoldTeams?: number;
  totalSilverTeams?: number;
  season?: Season;
  error: string | null;
  isLoading: boolean;
  status: HookStatus;
  dataSource: DataSource;
  lastUpdated?: Date;
}

// Champions types
export type ChampionTeam = EnhancedTeam & {
  daysRemaining?: number;
};

export interface LatestChampionsResult {
  tournament: EnhancedTournament | undefined;
  champs: ChampionTeam[];
  error: string | null;
  dataSource: DataSource;
  daysRemaining?: number;
}

// Current tournament leaderboard (specialized)
export interface CurrentTournamentLeaderboardResult
  extends TournamentLeaderboardResult {
  refreshInterval?: number;
}

// Store data types
export type StoreData = {
  tournaments: (Tournament & { teams: Team[]; golfers: Golfer[] })[];
  tours: Tour[];
  tourCards: TourCard[];
  tiers: Tier[];
};

// API response types
export type APITournamentData = {
  tournament: Tournament & { course: Course };
  teams: (Team & { tourCard: TourCard & { member: Member } })[];
  golfers: Golfer[];
  tours: Tour[];
};

export type APIMemberData = {
  member: Member;
  teamsBySeason: {
    seasonId: string;
    teams: MemberTeamHistory[];
  }[];
  statistics: {
    totalSeasons: number;
    totalTournaments: number;
    totalTeams: number;
    wins: number;
    topTens: number;
    cuts: number;
    averageScore: number;
    bestFinish: number | null;
  };
};

export type APITourCardData = {
  tourCard: TourCard;
  teams: TourCardTeamHistory[];
  statistics: TourCardStatistics;
};

export type APIPlayoffData = {
  season: Season;
  playoffsByTour: PlayoffsByTour[];
};

// Hook options types
export type MemberHistoryOptions = {
  seasonId?: string;
  allSeasons?: boolean;
  includeMissed?: boolean;
};

export type TourCardHistoryOptions = {
  seasonId?: string;
  allSeasons?: boolean;
  currentSeasonOnly?: boolean;
};

export type TournamentLeaderboardOptions = {
  forceAPI?: boolean;
  refreshInterval?: number;
};
