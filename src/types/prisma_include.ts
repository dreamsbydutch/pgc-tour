import type { Prisma } from "@prisma/client";

export const tourDataIncludeTourCard = {
  tourCards: true,
} satisfies Prisma.TourInclude;
export type TourData = Prisma.TourGetPayload<{
  include: typeof tourDataIncludeTourCard;
}>;

export const tournamentDataInclude = {
  tours: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
      shortForm: true,
      buyIn: true,
    },
  },
  tier: { select: { name: true, points: true, payouts: true } },
  season: { select: { year: true, number: true } },
  course: {
    select: {
      apiId: true,
      name: true,
      location: true,
      par: true,
      front: true,
      back: true,
    },
  },
} satisfies Prisma.TournamentInclude;
export type TournamentData = Prisma.TournamentGetPayload<{
  include: typeof tournamentDataInclude;
}>;

export const teamDataInclude = {
  tourCard: true,
  tournament: true,
} satisfies Prisma.TeamInclude;
export type TeamData = Prisma.TeamGetPayload<{
  include: typeof teamDataInclude;
}>;

export const tourCardDataInclude = {
  member: true,
  tour: true,
} satisfies Prisma.TourCardInclude;
export type TourCardData = Prisma.TourCardGetPayload<{
  include: typeof tourCardDataInclude;
}>;
