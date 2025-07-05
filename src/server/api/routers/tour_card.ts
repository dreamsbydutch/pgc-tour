import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tourCard.findMany({
      include: { member: true },
    });
  }),

  getByDisplayName: publicProcedure
    .input(z.object({ name: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findFirst({
        where: { displayName: input.name, seasonId: input.seasonId },
        include: { member: true },
      });
    }),

  getById: publicProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({
        where: { id: input.tourCardId },
        include: { member: true },
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
        include: { member: true },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        include: { member: true, teams: true, tour: true },
      });
    }),

  getByTourId: publicProcedure
    .input(z.object({ tourId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { tourId: input.tourId },
        include: { member: true },
      });
    }),
  getSelfBySeason: publicProcedure
    .input(
      z.object({
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.season.findUnique({
        where: { year: new Date().getFullYear() },
      });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: ctx.user?.id,
        },
        include: { member: true },
      });
    }),
  getAllCurrent: publicProcedure.query(async ({ ctx }) => {
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
      },
      include: { member: true },
    });
  }),

  getSelfCurrent: publicProcedure.query(async ({ ctx }) => {
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
        memberId: ctx.user?.id,
      },
      include: { member: true },
    });
  }),

  getByUserSeason: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: input.userId,
        },
        include: { member: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        seasonId: z.string().min(1),
        email: z.string().min(1),
        displayName: z.string().min(1),
        fullName: z.string().min(1),
        buyin: z.number().min(1),
        tourId: z.string().min(1),
        memberId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.create({
        data: {
          seasonId: input.seasonId,
          displayName: input.displayName,
          tourId: input.tourId,
          memberId: input.memberId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        position: z.string().optional().nullable(),
        appearances: z.number().optional(),
        topTen: z.number().optional(),
        win: z.number().optional(),
        madeCut: z.number().optional(),
        playoff: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.update({
        where: { id: input.id },
        data: {
          earnings: input.earnings,
          points: input.points,
          position: input.position,
          displayName: input.displayName,
          appearances: input.appearances,
          topTen: input.topTen,
          win: input.win,
          madeCut: input.madeCut,
          playoff: input.playoff,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ tourCardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.delete({
        where: { id: input.tourCardId },
      });
    }),

  getHistoricalTeams: publicProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get current season to exclude it
      const currentSeason = await ctx.db.season.findFirst({
        where: { year: new Date().getFullYear() },
      });

      // Get the tour card details
      const tourCard = await ctx.db.tourCard.findUnique({
        where: { id: input.tourCardId },
        include: {
          tour: true,
          season: true,
          member: true,
        },
      });

      if (!tourCard) {
        return null;
      }

      // Get all teams for this tour card from previous seasons
      const teams = await ctx.db.team.findMany({
        where: {
          tourCardId: input.tourCardId,
          tournament: {
            seasonId: {
              not: currentSeason?.id,
            },
          },
        },
        include: {
          tournament: {
            include: {
              course: true,
              tier: true,
              season: true,
            },
          },
          tourCard: {
            include: {
              tour: true,
              season: true,
              member: true,
            },
          },
        },
        orderBy: [
          { tournament: { season: { year: "desc" } } },
          { tournament: { startDate: "desc" } },
        ],
      });

      // Get golfers for all teams
      const golfersByTournament = await Promise.all(
        teams.map(async (team) => {
          const golfers = await ctx.db.golfer.findMany({
            where: {
              tournamentId: team.tournamentId,
              apiId: { in: team.golferIds },
            },
            orderBy: { position: "asc" },
          });
          return { teamId: team.id, golfers };
        }),
      );

      const golfersMap = new Map(
        golfersByTournament.map(({ teamId, golfers }) => [teamId, golfers]),
      );

      // Enrich teams with golfer data
      const enrichedTeams = teams.map((team) => ({
        team,
        tournament: team.tournament,
        tour: team.tourCard.tour,
        tourCard: team.tourCard,
        tier: team.tournament.tier,
        golfers: golfersMap.get(team.id) || [],
      }));

      // Calculate statistics
      const totalSeasons = new Set(teams.map((t) => t.tournament.seasonId))
        .size;
      const totalTeams = teams.length;
      const wins = teams.filter(
        (t) => t.position === "1" || t.position === "T1",
      ).length;
      const topTens = teams.filter((t) => {
        const pos = parseInt(t.position?.replace(/[^0-9]/g, "") || "999");
        return pos <= 10;
      }).length;
      const cuts = teams.filter((t) => t.makeCut === 1).length;

      const scoresSum = teams.reduce((sum, t) => sum + (t.score || 0), 0);
      const averageScore =
        totalTeams > 0 ? Math.round((scoresSum / totalTeams) * 100) / 100 : 0;

      const bestFinish = teams.reduce(
        (best, t) => {
          const pos = parseInt(t.position?.replace(/[^0-9]/g, "") || "999");
          return best === null || pos < best ? pos : best;
        },
        null as number | null,
      );

      return {
        tourCard,
        teams: enrichedTeams,
        statistics: {
          totalSeasons,
          totalTeams,
          wins,
          topTens,
          cuts,
          averageScore,
          bestFinish,
        },
      };
    }),
});
