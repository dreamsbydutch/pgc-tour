"use client";

import { usePGCTourStore } from "./store";
import type {
  UseSeasonDataReturn,
  UseCurrentMemberReturn,
  UseCurrentMemberTourReturn,
  UsePastTournamentDataReturn,
} from "./types";

/**
 * Hook to get current member data
 */
export const useCurrentMember = (): UseCurrentMemberReturn => {
  const member = usePGCTourStore((state) => state.member);
  return { member };
};

/**
 * Hook to get current season data
 */
export const useCurrentSeason = () => {
  const currentSeason = usePGCTourStore((state) => state.currentSeason);
  return { currentSeason };
};

/**
 * Hook to get all season-related data (tours, tiers, tournaments, tour cards, courses)
 */
export const useSeasonData = (): UseSeasonDataReturn => {
  const { currentSeason, tours, tiers, tournaments, tourCards, courses } =
    usePGCTourStore((state) => ({
      currentSeason: state.currentSeason,
      tours: state.tours,
      tiers: state.tiers,
      tournaments: state.tournaments,
      tourCards: state.tourCards,
      courses: state.courses,
    }));

  return {
    currentSeason,
    tours,
    tiers,
    tournaments,
    tourCards,
    courses,
  };
};

/**
 * Hook to get current member's tour card and tour information
 */
export const useCurrentMemberTour = (): UseCurrentMemberTourReturn => {
  const { member, tourCards, tours } = usePGCTourStore((state) => ({
    member: state.member,
    tourCards: state.tourCards,
    tours: state.tours,
  }));

  const memberTourCard =
    member && tourCards.length > 0
      ? tourCards.find((card) => card.memberId === member.id) || null
      : null;

  const memberTour =
    memberTourCard && tours.length > 0
      ? tours.find((tour) => tour.id === memberTourCard.tourId) || null
      : null;

  return {
    tourCard: memberTourCard,
    tour: memberTour,
  };
};

/**
 * Hook to get past tournament data (teams and golfers from completed tournaments)
 */
export const usePastTournamentData = (): UsePastTournamentDataReturn => {
  const pastData = usePGCTourStore((state) => state.pastData);

  return {
    teams: pastData.teams,
    golfers: pastData.golfers,
  };
};

/**
 * Hook to get tournaments by tour ID
 */
export const useTournamentsByTour = (tourId: string | null) => {
  const tournaments = usePGCTourStore((state) => state.tournaments);

  return {
    tournaments: tourId
      ? tournaments.filter((t) => {
          // Note: Tournament-Tour relationship is many-to-many
          // This filter will need to be updated once the tours relation is included in the query
          // For now, return all tournaments until proper tour filtering is implemented
          return true;
        })
      : tournaments,
  };
};

/**
 * Hook to get tour cards by tour ID
 */
export const useTourCardsByTour = (tourId: string | null) => {
  const tourCards = usePGCTourStore((state) => state.tourCards);

  return {
    tourCards: tourId ? tourCards.filter((tc) => tc.tourId === tourId) : [],
  };
};

/**
 * Hook to get a specific tournament by ID
 */
export const useTournament = (tournamentId: string | null) => {
  const tournaments = usePGCTourStore((state) => state.tournaments);

  return {
    tournament: tournamentId
      ? tournaments.find((t) => t.id === tournamentId) || null
      : null,
  };
};

/**
 * Hook to get a specific tour by ID
 */
export const useTour = (tourId: string | null) => {
  const tours = usePGCTourStore((state) => state.tours);

  return {
    tour: tourId ? tours.find((t) => t.id === tourId) || null : null,
  };
};

/**
 * Hook to get a specific tour card by ID
 */
export const useTourCard = (tourCardId: string | null) => {
  const tourCards = usePGCTourStore((state) => state.tourCards);

  return {
    tourCard: tourCardId
      ? tourCards.find((tc) => tc.id === tourCardId) || null
      : null,
  };
};

/**
 * Hook to get the currently selected tour card
 */
export const useSelectedTourCard = () => {
  const { selectedTourCardId, tourCards } = usePGCTourStore((state) => ({
    selectedTourCardId: state.selectedTourCardId,
    tourCards: state.tourCards,
  }));

  const tourCard = selectedTourCardId
    ? tourCards.find((tc) => tc.id === selectedTourCardId) || null
    : null;

  return {
    selectedTourCard: tourCard,
    selectedTourCardId,
  };
};

/**
 * Hook to get all courses
 */
export const useCourses = () => {
  const courses = usePGCTourStore((state) => state.courses);
  return { courses };
};

/**
 * Hook to get a specific course by ID
 */
export const useCourse = (courseId: string | null) => {
  const courses = usePGCTourStore((state) => state.courses);

  return {
    course: courseId ? courses.find((c) => c.id === courseId) || null : null,
  };
};

/**
 * Hook to get tournaments with their course data
 */
export const useTournamentsWithCourses = () => {
  const tournaments = usePGCTourStore((state) => state.tournaments);
  const courses = usePGCTourStore((state) => state.courses);

  const tournamentsWithCourses = tournaments.map((tournament) => ({
    ...tournament,
    course: courses.find((c) => c.id === tournament.courseId) || null,
  }));

  return { tournaments: tournamentsWithCourses };
};

/**
 * Hook to get all tournaments
 */
export const useTournaments = () => {
  const tournaments = usePGCTourStore((state) => state.tournaments);

  return {
    tournaments,
  };
};

/**
 * Hook to get the active tournament (current or most recently started tournament)
 */
export const useActiveTournament = () => {
  const tournaments = usePGCTourStore((state) => state.tournaments);

  // Find the active tournament (currently in progress)
  const now = new Date();
  const activeTournament = tournaments.find((tournament) => {
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    return (
      startDate <= now && endDate >= now && (tournament.currentRound || 0) < 5
    );
  });

  // If no active tournament, get the most recently started tournament
  const fallbackTournament = tournaments
    .filter((t) => new Date(t.startDate) <= now)
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0];

  return {
    tournament: activeTournament || fallbackTournament || null,
  };
};
