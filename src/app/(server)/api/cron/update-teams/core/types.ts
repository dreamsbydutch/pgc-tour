import type {
  Team,
  Golfer,
  Tournament,
  Tier,
  Course,
  Tour,
} from "@prisma/client";

export type TournamentWithRelations = Tournament & {
  course: Course;
  tier: Tier & { payouts?: number[] | null; points?: number[] | null };
  golfers: Golfer[];
  teams: Team[];
  tours: Tour[];
};

export type TeamCalculation = {
  round: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  today: number | null;
  thru: number | null;
  score: number | null;
  position: string | null;
  pastPosition: string | null;
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
  roundThreeTeeTime?: string | null;
  roundFourTeeTime?: string | null;
  points: number | null;
  earnings: number | null;
};

export type CronJobResult = {
  success: boolean;
  message: string;
  status?: number;
  redirect?: string;
  error?: string;
  details?: string;
  stats?: Record<string, unknown>;
};

export type UpdateResult = {
  teamsUpdated: number;
  totalTeams: number;
  tournamentProcessed: boolean;
};

export type PlayoffBracket = "gold" | "silver";

export type WorstOfDayContext = {
  bracket: PlayoffBracket;
  eventIndex: 1 | 2 | 3;
  roundNumber: 1 | 2 | 3 | 4;
  live: boolean;
};

export type WorstOfDayResult = {
  todayContribution: number;
  thru?: number;
  overParContribution?: number;
};
