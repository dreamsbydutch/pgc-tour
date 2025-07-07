import {
  Course,
  Member,
  Season,
  Tier,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";

// Minimal types for store - only essential data without heavy includes
export type MinimalCourse = Pick<Course, "id" | "name" | "location" | "par" | "apiId">;
export type MinimalTier = Pick<Tier, "id" | "name" | "seasonId">;
export type MinimalTour = Pick<
  Tour,
  "id" | "name" | "logoUrl" | "buyIn" | "shortForm" | "seasonId"
>;
export type MinimalTourCard = Pick<
  TourCard,
  | "id"
  | "memberId"
  | "tourId"
  | "seasonId"
  | "displayName"
  | "earnings"
  | "points"
  | "position"
>;
export type MinimalTournament = Pick<
  Tournament,
  | "id"
  | "name"
  | "logoUrl"
  | "startDate"
  | "endDate"
  | "livePlay"
  | "currentRound"
  | "seasonId"
  | "courseId"
  | "tierId"
> & {
  course: MinimalCourse;
  tier: MinimalTier;
};

// Utility types
export type SortDirection = "asc" | "desc";
export type TournamentStatus = "upcoming" | "current" | "completed";

export type TournamentFilters = {
  status?: TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
};

export type TourCardFilters = {
  tourIds?: string[];
  earnings?: { min?: number; max?: number };
  points?: { min?: number; max?: number };
  hasEarnings?: boolean;
};

export type BatchUpdate<T> = { id: string; updates: Partial<T> };

export type SeasonalData = {
  // Core data
  season: Season | null;
  member: Member | null;
  tourCard: TourCard | null;
  allTourCards: MinimalTourCard[] | null;
  tournaments: MinimalTournament[] | null;
  tiers: MinimalTier[] | null;
  tours: MinimalTour[] | null;
  lastLoaded: number | null;

  // Basic operations
  setSeasonalData: (data: Partial<SeasonalData>) => void;
  reset: () => void;
  updateMember: (member: Member) => void;
  clearAndSet: (data: Partial<SeasonalData>) => void;

  // Generic getters with filtering and sorting
  getTournaments: (
    filters?: TournamentFilters,
    sortBy?: keyof MinimalTournament,
    direction?: SortDirection,
  ) => MinimalTournament[];
  getTourCards: (
    filters?: TourCardFilters,
    sortBy?: keyof MinimalTourCard,
    direction?: SortDirection,
  ) => MinimalTourCard[];
  getTours: (
    sortBy?: keyof MinimalTour,
    direction?: SortDirection,
  ) => MinimalTour[];
  getTiers: (
    sortBy?: keyof MinimalTier,
    direction?: SortDirection,
  ) => MinimalTier[];
  getCourses: (location?: string) => MinimalCourse[];

  // CRUD operations
  updateItem: <T extends { id: string }>(
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    id: string,
    updates: Partial<T>,
  ) => void;
  addItem: <T>(
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    item: T,
  ) => void;
  removeItem: (
    type: "tournaments" | "tourCards" | "tours" | "tiers",
    id: string,
  ) => void;
  batchUpdate: <T extends { id: string }>(
    type: "tournaments" | "tourCards",
    updates: BatchUpdate<T>[],
  ) => void;

  // Search operations
  search: (
    query: string,
    types?: ("tournaments" | "tourCards" | "tours" | "tiers")[],
  ) => {
    tournaments: MinimalTournament[];
    tourCards: MinimalTourCard[];
    tours: MinimalTour[];
    tiers: MinimalTier[];
  };

  // Computed values
  getStats: () => {
    tournaments: {
      total: number;
      byStatus: Record<TournamentStatus, number>;
      byTier: Record<string, number>;
    };
    tourCards: {
      total: number;
      active: number;
      earnings: ReturnType<typeof calculateStats>;
      byTour: Record<string, number>;
    };
    tours: { total: number; totalBuyIn: number; avgBuyIn: number };
  };

  // Utility
  isDataStale: () => boolean;
  getDataAge: () => number;
  validateData: () => { isValid: boolean; errors: string[] };
};
