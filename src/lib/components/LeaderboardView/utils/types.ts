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

// Extended types with relations
export type TeamWithTourCard = Team & {
  tourCard?: TourCard | null;
};

export type TournamentGolfer = {
  id: number;
  apiId: number;
  position: string;
  playerName: string;
  today: number;
  thru: number;
  score: number;
  group: number;
  roundOne?: number | null;
  roundTwo?: number | null;
  roundThree?: number | null;
  roundFour?: number | null;
  makeCut?: number | null;
  usage?: number | null;
};

export type LeaderboardGolfer = {
  apiId: number;
  position: string;
  posChange: number;
  playerName: string;
  score: number;
  today: number;
  thru: number;
  group: number;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  round: number | null;
  rating: number;
  endHole: number;
  usage: number;
  makeCut: number;
  topTen: number;
  country: string;
  win: number;
  worldRank: number;
};

export type LeaderboardTeam = {
  pastPosition: string;
  position: string;
  golferIds: number[];
  today: number;
  thru: number;
  score: number;
  round: number;
  points: number;
  earnings: number;
  id: number;
};

export type LeaderboardTournament = {
  currentRound: number;
};

export type LeaderboardTourCard = {
  id: string;
  memberId: string;
  displayName: string;
};

export type LeaderboardMember = {
  friends: string[] | null;
};

// Re-export Prisma types for convenience
export type { Golfer, Team, Tournament, TourCard, Member };
