import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.member.findMany({});
  }),
  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findUnique({
        where: { email: input.email },
      });
    }),
  getByLastName: publicProcedure
    .input(z.object({ lastname: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findMany({
        where: { lastname: input.lastname },
      });
    }),
  getSelf: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return await ctx.db.member.findUnique({
      where: { id: ctx.user.id },
    });
  }),
  getById: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findUnique({
        where: { id: input.memberId },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string(),
        firstname: z.string(),
        lastname: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.create({
        data: {
          id: input.id,
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
        },
      });
      return updatedUser;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().optional(),
        firstname: z.string().nullable().optional(),
        lastname: z.string().nullable().optional(),
        account: z.number().optional(),
        friends: z.string().array().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: input.id },
        data: {
          account: input.account,
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
          friends: input.friends,
        },
      });
      return updatedUser;
    }),
  addFriend: protectedProcedure
    .input(
      z.object({
        friendId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: ctx.user.id },
        data: {
          friends: {
            push: input.friendId,
          },
        },
      });
      return updatedUser;
    }),
  removeFriend: protectedProcedure
    .input(
      z.object({
        friendsList: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: ctx.user.id },
        data: {
          friends: {
            set: input.friendsList,
          },
        },
      });
      return updatedUser;
    }),
  getAllTimeTeams: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get member details
      const member = await ctx.db.member.findUnique({
        where: { id: input.memberId },
      });

      if (!member) {
        return null;
      }

      // Get all tour cards for this member across all seasons
      const tourCards = await ctx.db.tourCard.findMany({
        where: { memberId: input.memberId },
        include: {
          tour: true,
          season: true,
        },
        orderBy: {
          season: { year: "desc" },
        },
      });

      // Get all teams for these tour cards
      const teams = await ctx.db.team.findMany({
        where: {
          tourCardId: { in: tourCards.map((card) => card.id) },
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

      // Group teams by season
      const teamsBySeason = tourCards.reduce((acc, tourCard) => {
        const seasonTeams = teams
          .filter((team) => team.tourCardId === tourCard.id)
          .map((team) => ({
            team,
            tournament: team.tournament,
            tour: tourCard.tour,
            tourCard,
            tier: team.tournament.tier,
            golfers: golfersMap.get(team.id) || [],
          }));

        if (seasonTeams.length > 0) {
          const existingSeason = acc.find(
            (s) => s.season.id === tourCard.seasonId,
          );
          if (existingSeason) {
            existingSeason.teams.push(...seasonTeams);
          } else {
            acc.push({
              season: tourCard.season,
              teams: seasonTeams,
              tourCards: [tourCard],
            });
          }
        }

        return acc;
      }, [] as any[]);

      // Calculate all-time statistics
      const allTeams = teams;
      const totalSeasons = teamsBySeason.length;
      const totalTournaments = new Set(allTeams.map((t) => t.tournamentId))
        .size;
      const totalTeams = allTeams.length;
      const wins = allTeams.filter(
        (t) => t.position === "1" || t.position === "T1",
      ).length;
      const topTens = allTeams.filter((t) => {
        const pos = parseInt(t.position?.replace(/[^0-9]/g, "") || "999");
        return pos <= 10;
      }).length;
      const cuts = allTeams.filter((t) => t.makeCut === 1).length;

      const scoresSum = allTeams.reduce((sum, t) => sum + (t.score || 0), 0);
      const averageScore =
        totalTeams > 0 ? Math.round((scoresSum / totalTeams) * 100) / 100 : 0;

      const bestFinish = allTeams.reduce(
        (best, t) => {
          const pos = parseInt(t.position?.replace(/[^0-9]/g, "") || "999");
          return best === null || pos < best ? pos : best;
        },
        null as number | null,
      );

      return {
        member,
        teamsBySeason,
        statistics: {
          totalSeasons,
          totalTournaments,
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
