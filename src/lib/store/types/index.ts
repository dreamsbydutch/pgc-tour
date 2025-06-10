// Core data types for the new store architecture

export interface Tournament {
  id: string;
  name: string;
  status: "upcoming" | "active" | "completed";
  startDate: Date;
  endDate: Date;
  venue: string;
  purse: number;
  currentRound: number;
  totalRounds: number;
  cutLine?: number;
  isMinorTournament: boolean;
  weatherConditions?: WeatherConditions;
  course: Course;
  metadata: TournamentMetadata;
}

export interface Course {
  id: string;
  name: string;
  par: number;
  yardage: number;
  holes: Hole[];
  difficulty: "easy" | "medium" | "hard";
}

export interface Hole {
  number: number;
  par: number;
  yardage: number;
  handicap: number;
}

export interface WeatherConditions {
  temperature: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  conditions: string;
  lastUpdated: Date;
}

export interface TournamentMetadata {
  description: string;
  featuredGroups: string[];
  coverage: {
    tv: string[];
    streaming: string[];
  };
  sponsors: string[];
  prizeBreakdown: Record<string, number>;
}

export interface Golfer {
  id: string;
  name: string;
  position: number | "CUT" | "WD" | "DQ";
  totalScore: number;
  totalStrokes: number;
  roundScores: number[];
  earnings: number;
  isAmateur: boolean;
  country: string;
  worldRanking?: number;
  stats: GolferStats;
  rounds: Round[];
}

export interface Round {
  roundNumber: number;
  score: number;
  strokes: number;
  holes: HoleScore[];
  startTime?: Date;
  endTime?: Date;
  status: "not_started" | "in_progress" | "completed";
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  par: number;
  score: number; // relative to par
}

export interface GolferStats {
  drivingDistance: number;
  drivingAccuracy: number;
  greensInRegulation: number;
  puttingAverage: number;
  scrambling: number;
  birdieAverage: number;
  eagleCount: number;
}

export interface LeaderboardEntry {
  golfer: Golfer;
  position: number | "CUT" | "WD" | "DQ";
  totalScore: number;
  today: number;
  thru: number | "F";
  teeTime?: Date;
}

export interface Team {
  id: string;
  name: string;
  golfers: Golfer[];
  totalScore: number;
  position: number;
  owner: string;
  isUserTeam: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  favoriteGolfers: string[];
  notifications: {
    leaderboardUpdates: boolean;
    favoriteGolferUpdates: boolean;
    tournamentReminders: boolean;
  };
  display: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    showRoundDetails: boolean;
  };
  timezone: string;
}

export interface UserStats {
  totalTournaments: number;
  bestFinish: number;
  averageFinish: number;
  totalEarnings: number;
  weeklyWins: number;
}

// Store State Types
export interface TournamentState {
  currentTournament: Tournament | null;
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface UserState {
  profile: UserProfile | null;
  userTeams: Team[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  selectedGolferId: string | null;
  selectedTeamId: string | null;
  activeTab: "leaderboard" | "teams" | "course" | "stats";
  showFilters: boolean;
  filters: {
    position: "all" | "top10" | "cut" | "missed_cut";
    country: string | null;
    amateur: boolean | null;
  };
  sortBy: "position" | "name" | "score" | "earnings";
  sortDirection: "asc" | "desc";
  isMobile: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: "success" | "error";
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  status: "success" | "error";
  message?: string;
}

// Hook Return Types
export interface UseTournamentDataReturn {
  tournament: Tournament | null;
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseLeaderboardDataReturn {
  leaderboard: LeaderboardEntry[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  toggleAutoRefresh: () => void;
  autoRefresh: boolean;
}

export interface UseUserDataReturn {
  profile: UserProfile | null;
  userTeams: Team[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export interface UseUIStateReturn {
  selectedGolferId: string | null;
  selectedTeamId: string | null;
  activeTab: UIState["activeTab"];
  showFilters: boolean;
  filters: UIState["filters"];
  sortBy: UIState["sortBy"];
  sortDirection: UIState["sortDirection"];
  isMobile: boolean;
  actions: {
    selectGolfer: (id: string | null) => void;
    selectTeam: (id: string | null) => void;
    setActiveTab: (tab: UIState["activeTab"]) => void;
    toggleFilters: () => void;
    updateFilters: (filters: Partial<UIState["filters"]>) => void;
    setSorting: (
      sortBy: UIState["sortBy"],
      direction?: UIState["sortDirection"],
    ) => void;
    setIsMobile: (isMobile: boolean) => void;
  };
}

// Error Types
export interface StoreError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Event Types
export interface StoreEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface LeaderboardUpdateEvent extends StoreEvent {
  type: "leaderboard_update";
  payload: {
    golferId: string;
    oldPosition: number;
    newPosition: number;
    scoreChange: number;
  };
}

export interface TournamentStatusEvent extends StoreEvent {
  type: "tournament_status_change";
  payload: {
    tournamentId: string;
    oldStatus: Tournament["status"];
    newStatus: Tournament["status"];
  };
}

// Utility Types
export type LoadingState = "idle" | "loading" | "success" | "error";

export type SortableFields =
  | keyof Pick<Golfer, "name" | "totalScore" | "position">
  | keyof Pick<Team, "name" | "totalScore" | "position">;

export type FilterableFields = {
  position: "all" | "top10" | "cut" | "missed_cut";
  country: string | null;
  amateur: boolean | null;
};

// Store Action Types
export interface StoreActions {
  reset: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Query Keys for React Query
export const QUERY_KEYS = {
  tournament: (id: string) => ["tournament", id],
  tournaments: () => ["tournaments"],
  leaderboard: (tournamentId: string) => ["leaderboard", tournamentId],
  teams: (tournamentId: string) => ["teams", tournamentId],
  user: (id: string) => ["user", id],
  userTeams: (userId: string) => ["userTeams", userId],
} as const;
