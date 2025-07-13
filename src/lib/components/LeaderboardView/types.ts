/**
 * Types for LeaderboardView components
 */

import type {
  Golfer,
  Team,
  Tournament,
  TourCard,
  Member,
} from "@prisma/client";

// Base types for components
export type LeaderboardTournament = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  currentRound: number | null;
  tierId: string;
  courseId: string;
  seasonId: string;
  apiId: string | null;
  logoUrl: string | null;
  livePlay: boolean | null;
  round: number | null;
  course: {
    id: string;
    name: string;
    par: number | null;
  } | null;
};

export type LeaderboardGolfer = {
  id: number;
  apiId: number;
  position: string | null;
  playerName: string;
  posChange: number | null;
  score: number | null;
  today: number | null;
  thru: number | null;
  group: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  round: number | null;
  rating: number | null;
  endHole: number | null;
  usage: number | null;
  makeCut: number | null;
  topTen: number | null;
  country: string | null;
  win: number | null;
  worldRank: number | null;
  // Tee time fields
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
  roundThreeTeeTime?: string | null;
  roundFourTeeTime?: string | null;
};

export type LeaderboardTeam = {
  id: number;
  pastPosition: string | null;
  position: string | null;
  golferIds: number[];
  today: number | null;
  thru: number | null;
  score: number | null;
  round: number | null;
  points: number | null;
  earnings: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  // Tee time fields
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
  roundThreeTeeTime?: string | null;
  roundFourTeeTime?: string | null;
};

export type LeaderboardTour = {
  id: string;
  name: string;
  shortForm: string;
  logoUrl: string | null;
};

export type LeaderboardTourCard = {
  id: string;
  memberId: string;
  displayName: string;
  tourId?: string;
  playoff?: number | null;
};

export type LeaderboardMember = {
  id: string;
  role: string;
  friends: string[] | null;
};

// Extended types with relations
export type TeamWithTourCard = Team & {
  tourCard?: TourCard | null;
};

// Props for LeaderboardView container
export type LeaderboardViewProps = {
  variant: "regular" | "playoff" | "historical";
  tournament: LeaderboardTournament;
  tours: LeaderboardTour[];
  actualTours: LeaderboardTour[];
  tourCard: LeaderboardTourCard | null;
  member: LeaderboardMember | null;
  golfers: LeaderboardGolfer[];
  teams: TeamWithTourCard[];
  tourCards: LeaderboardTourCard[];
  inputTour?: string;
};

// Re-export Prisma types for convenience
export type { Golfer, Team, Tournament, TourCard, Member };
