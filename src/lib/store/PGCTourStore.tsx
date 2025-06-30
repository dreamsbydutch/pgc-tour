"use client";

import { create } from "zustand";
import { createClient } from "@/src/lib/supabase/client";
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
} from "@prisma/client";

interface StoreState {
  // Auth state
  authUser: User | null;
  authSession: Session | null;
  member: Member | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;

  // Season data
  currentSeason: Season | null;

  // Core data for current season
  tourCards: TourCard[];
  tours: Tour[];
  tiers: Tier[];
  tournaments: Tournament[];

  // Past tournament data (for completed tournaments only)
  pastTeams: Team[];
  pastGolfers: Golfer[];

  // Current member's specific data
  currentMemberTourCard: TourCard | null;
  currentMemberTour: Tour | null;

  // Loading states
  dataLoading: boolean;
  dataError: string | null;

  // UI state
  selectedTournamentId: string | null;
  selectedTourId: string | null;

  // Actions
  initializeStore: () => Promise<void>;
  signOut: () => Promise<void>;
  setSelectedTournament: (id: string | null) => void;
  setSelectedTour: (id: string | null) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const usePGCTourStore = create<StoreState>((set, get) => {
  const supabase = createClient();

  // Helper functions
  const fetchMember = async (userId: string): Promise<Member | null> => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching member:", error);
      return null;
    }
  };

  const fetchCurrentSeason = async (): Promise<Season | null> => {
    try {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_current", true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching current season:", error);
      return null;
    }
  };

  const fetchPastTournamentData = async (seasonId: string) => {
    try {
      // Get tournaments that have ended (assuming there's an end_date or status field)
      const { data: completedTournaments, error: tournamentsError } =
        await supabase
          .from("tournaments")
          .select("id")
          .eq("season_id", seasonId)
          .or("status.eq.completed,end_date.lt." + new Date().toISOString());

      if (tournamentsError) throw tournamentsError;

      if (completedTournaments && completedTournaments.length > 0) {
        const tournamentIds = completedTournaments.map((t) => t.id);

        // Fetch teams and golfers for completed tournaments
        const [teamsRes, golfersRes] = await Promise.all([
          supabase.from("teams").select("*").in("tournament_id", tournamentIds),
          supabase
            .from("golfers")
            .select("*")
            .in("tournament_id", tournamentIds),
        ]);

        if (teamsRes.error) throw teamsRes.error;
        if (golfersRes.error) throw golfersRes.error;

        set({
          pastTeams: teamsRes.data || [],
          pastGolfers: golfersRes.data || [],
        });
      }
    } catch (error) {
      console.error("Error fetching past tournament data:", error);
      // Don't throw here, just log - this is supplementary data
    }
  };

  const fetchSeasonData = async (seasonId: string) => {
    try {
      set({ dataLoading: true, dataError: null });

      // Fetch all core data in parallel
      const [tourCardsRes, toursRes, tiersRes, tournamentsRes] =
        await Promise.all([
          supabase.from("tour_cards").select("*").eq("season_id", seasonId),
          supabase.from("tours").select("*").eq("season_id", seasonId),
          supabase.from("tiers").select("*").eq("season_id", seasonId),
          supabase.from("tournaments").select("*").eq("season_id", seasonId),
        ]);

      // Check for errors
      if (tourCardsRes.error) throw tourCardsRes.error;
      if (toursRes.error) throw toursRes.error;
      if (tiersRes.error) throw tiersRes.error;
      if (tournamentsRes.error) throw tournamentsRes.error;

      set({
        tourCards: tourCardsRes.data || [],
        tours: toursRes.data || [],
        tiers: tiersRes.data || [],
        tournaments: tournamentsRes.data || [],
        dataLoading: false,
        dataError: null,
      });

      // After setting the data, find current member's tour card and tour
      const { member } = get();
      if (member) {
        setCurrentMemberData(
          member,
          tourCardsRes.data || [],
          toursRes.data || [],
        );
      }

      // Fetch past tournament data (teams/golfers for completed tournaments)
      await fetchPastTournamentData(seasonId);
    } catch (error) {
      console.error("Error fetching season data:", error);
      set({
        dataLoading: false,
        dataError:
          error instanceof Error ? error.message : "Failed to load season data",
      });
    }
  };

  const setCurrentMemberData = (
    member: Member,
    tourCards: TourCard[],
    tours: Tour[],
  ) => {
    // Find the current member's tour card for this season
    const memberTourCard = tourCards.find(
      (card) => card.member_id === member.id,
    );

    // Find the tour associated with the member's tour card
    const memberTour = memberTourCard
      ? tours.find((tour) => tour.id === memberTourCard.tour_id)
      : null;

    set({
      currentMemberTourCard: memberTourCard || null,
      currentMemberTour: memberTour || null,
    });
  };

  const updateAuthState = async (
    user: User | null,
    session: Session | null,
  ) => {
    try {
      set({ authLoading: true, authError: null });

      let member: Member | null = null;

      if (user?.id) {
        member = await fetchMember(user.id);
      }

      set({
        authUser: user,
        authSession: session,
        member,
        isAuthenticated: !!(user && session),
        authLoading: false,
        authError: null,
      });

      // If user is authenticated, load season data
      if (user && session) {
        const currentSeason = await fetchCurrentSeason();
        if (currentSeason) {
          set({ currentSeason });
          await fetchSeasonData(currentSeason.id);
        }
      } else {
        // Clear data when user signs out
        set({
          currentSeason: null,
          tourCards: [],
          tours: [],
          tiers: [],
          tournaments: [],
          pastTeams: [],
          pastGolfers: [],
          currentMemberTourCard: null,
          currentMemberTour: null,
          selectedTournamentId: null,
          selectedTourId: null,
        });
      }
    } catch (error) {
      console.error("Error updating auth state:", error);
      set({
        authLoading: false,
        authError:
          error instanceof Error ? error.message : "Authentication error",
      });
    }
  };

  // Set up auth listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    await updateAuthState(session?.user || null, session);
  });

  return {
    // Initial state
    authUser: null,
    authSession: null,
    member: null,
    isAuthenticated: false,
    authLoading: true,
    authError: null,

    currentSeason: null,
    tourCards: [],
    tours: [],
    tiers: [],
    tournaments: [],
    pastTeams: [],
    pastGolfers: [],

    currentMemberTourCard: null,
    currentMemberTour: null,

    dataLoading: false,
    dataError: null,
    selectedTournamentId: null,
    selectedTourId: null,

    // Actions
    initializeStore: async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await updateAuthState(session?.user || null, session);
      } catch (error) {
        console.error("Error initializing store:", error);
        set({
          authLoading: false,
          authError:
            error instanceof Error ? error.message : "Initialization error",
        });
      }
    },

    signOut: async () => {
      try {
        await supabase.auth.signOut();
        // Auth listener will handle clearing state
      } catch (error) {
        console.error("Error signing out:", error);
        set({
          authError: error instanceof Error ? error.message : "Sign out error",
        });
      }
    },

    setSelectedTournament: (id) => {
      set({ selectedTournamentId: id });
    },

    setSelectedTour: (id) => {
      set({ selectedTourId: id });
    },

    refreshData: async () => {
      const { currentSeason } = get();
      if (currentSeason) {
        await fetchSeasonData(currentSeason.id);
      }
    },

    clearError: () => {
      set({ authError: null, dataError: null });
    },
  };
});

// Initialize store on client side
if (typeof window !== "undefined") {
  usePGCTourStore.getState().initializeStore();
}

// Simple provider component (optional - store works without it)
export function PGCTourStore({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
