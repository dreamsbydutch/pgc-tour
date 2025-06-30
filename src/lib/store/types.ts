import type { User, Session } from "@supabase/supabase-js";
import type {
  Member,
  TourCard,
  Tour,
  Tier,
  Tournament,
  Season,
  Team,
  Golfer,
  Course,
} from "@prisma/client";

// Store state interface - Simple persistent store
export interface PGCTourStoreState {
  // Auth state (not persisted)
  authUser: User | null;
  authSession: Session | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  // UI state (persisted)
  selectedTournamentId: string | null;
  selectedTourId: string | null;
  selectedTourCardId: string | null;
  // Data state (persisted)
  currentSeason: Season | null;
  tours: Tour[];
  tiers: Tier[];
  tournaments: Tournament[];
  tourCards: TourCard[];
  courses: Course[];
  member: Member | null;
  pastData: {
    teams: Team[];
    golfers: Golfer[];
  };

  // Actions
  setAuthUser: (user: User | null) => void;
  setAuthSession: (session: Session | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void; // UI actions
  setSelectedTournament: (id: string | null) => void;
  setSelectedTour: (id: string | null) => void;
  setSelectedTourCard: (id: string | null) => void;
  setCurrentSeason: (season: Season | null) => void;
  setTours: (tours: Tour[]) => void;
  setTiers: (tiers: Tier[]) => void;
  setTournaments: (tournaments: Tournament[]) => void;
  setTourCards: (tourCards: TourCard[]) => void;
  setCourses: (courses: Course[]) => void;
  setMember: (member: Member | null) => void;
  setPastData: (teams: Team[], golfers: Golfer[]) => void;
  clearAll: () => void;
  // Async actions
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  cleanup: () => void;
}

// Extended types for store usage
export interface MemberWithTourCard extends Member {
  tourCard?: TourCard | null;
  tour?: Tour | null;
}

export interface SeasonData {
  currentSeason: Season | null;
  tours: Tour[];
  tiers: Tier[];
  tournaments: Tournament[];
  tourCards: TourCard[];
  courses: Course[];
}

export interface PastTournamentData {
  teams: Team[];
  golfers: Golfer[];
}

export interface CurrentMemberData {
  member: Member | null;
  tourCard: TourCard | null;
  tour: Tour | null;
}

// Hook return types - Simple data access
export interface UseSeasonDataReturn {
  currentSeason: Season | null;
  tours: Tour[];
  tiers: Tier[];
  tournaments: Tournament[];
  tourCards: TourCard[];
  courses: Course[];
}

export interface UseCurrentMemberReturn {
  member: Member | null;
}

export interface UseCurrentMemberTourReturn {
  tourCard: TourCard | null;
  tour: Tour | null;
}

export interface UsePastTournamentDataReturn {
  teams: Team[];
  golfers: Golfer[];
}
