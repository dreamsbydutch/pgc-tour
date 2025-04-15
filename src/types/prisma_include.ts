import type { Prisma } from "@prisma/client";

export const teamDataInclude = {
  tourCard: true,
} satisfies Prisma.TeamInclude;
export type TeamData = Prisma.TeamGetPayload<{
  include: typeof teamDataInclude;
}>;

export const tourDataInclude = {
  tourCards: true,
} satisfies Prisma.TourInclude;
export type TourData = Prisma.TourGetPayload<{
  include: typeof tourDataInclude;
}>;

export const tourCardDataInclude = {
  member: true,
  tour: true,
} satisfies Prisma.TourCardInclude;
export type TourCardData = Prisma.TourCardGetPayload<{
  include: typeof tourCardDataInclude;
}>;

export const tournamentDataInclude = {
  course: true,
  tier: true,
  golfers: true,
} satisfies Prisma.TournamentInclude;
export type TournamentData = Prisma.TournamentGetPayload<{
  include: typeof tournamentDataInclude;
}>;
