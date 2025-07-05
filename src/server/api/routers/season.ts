import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.season.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.season.findUnique({ where: { id: input.id } });
    }),
  getByYear: publicProcedure
    .input(z.object({ year: z.number().min(2021) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.season.findUnique({ where: { year: input.year } });
    }),
  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    return ctx.db.season.findUnique({
      where: { year: currentYear },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        year: z.number().min(2021),
        number: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.season.create({
        data: {
          year: input.year,
          number: input.number,
        },
      });
      return null;
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        year: z.number().min(2021),
        number: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.season.update({
        where: { id: input.id },
        data: {
          year: input.year,
          number: input.number,
        },
      });
      return null;
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.season.delete({ where: { id: input.id } });
      return null;
    }),
  getPlayoffTeams: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get season details
      const season = await ctx.db.season.findUnique({
        where: { id: input.seasonId },
      });

      if (!season) {
        return null;
      }

      // Get all tours for this season with playoff spots
      const tours = await ctx.db.tour.findMany({
        where: { seasonId: input.seasonId },
        orderBy: { name: "asc" },
      });

      // Get all tournaments for this season
      const tournaments = await ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: {
          course: true,
          tier: true,
        },
        orderBy: { startDate: "asc" },
      });

      // Get all teams for this season
      const teams = await ctx.db.team.findMany({
        where: {
          tournament: { seasonId: input.seasonId },
        },
        include: {
          tournament: {
            include: {
              course: true,
              tier: true,
            },
          },
          tourCard: {
            include: {
              tour: true,
              member: true,
            },
          },
        },
        orderBy: [{ tournament: { startDate: "asc" } }, { points: "desc" }],
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

      // Calculate playoff teams for each tour
      const playoffsByTour = tours.map((tour) => {
        // Get all teams for this tour
        const tourTeams = teams.filter(
          (team) => team.tourCard.tourId === tour.id,
        );

        // Group teams by tour card and calculate season totals
        const teamsByTourCard = new Map();

        tourTeams.forEach((team) => {
          const tourCardId = team.tourCardId;
          if (!teamsByTourCard.has(tourCardId)) {
            teamsByTourCard.set(tourCardId, {
              tourCard: team.tourCard,
              teams: [],
              totalPoints: 0,
              totalEarnings: 0,
              wins: 0,
              topTens: 0,
              cuts: 0,
              appearances: 0,
            });
          }

          const seasonData = teamsByTourCard.get(tourCardId);
          seasonData.teams.push({
            ...team,
            golfers: golfersMap.get(team.id) || [],
          });
          seasonData.totalPoints += team.points || 0;
          seasonData.totalEarnings += team.earnings || 0;
          seasonData.wins +=
            team.position === "1" || team.position === "T1" ? 1 : 0;

          const pos = parseInt(team.position?.replace(/[^0-9]/g, "") || "999");
          if (pos <= 10) seasonData.topTens += 1;
          if (team.makeCut === 1) seasonData.cuts += 1;
          seasonData.appearances += 1;
        });

        // Convert to array and sort by points (primary) then earnings (secondary)
        const sortedTeams = Array.from(teamsByTourCard.values()).sort(
          (a, b) => {
            if (b.totalPoints !== a.totalPoints) {
              return b.totalPoints - a.totalPoints;
            }
            return b.totalEarnings - a.totalEarnings;
          },
        );

        // Determine playoff spots from tour configuration
        const playoffSpots = tour.playoffSpots || [];
        const goldSpots = playoffSpots[0] || 0;
        const silverSpots = playoffSpots[1] || 0;

        let goldTeams: any[] = [];
        let silverTeams: any[] = [];

        if (playoffSpots.length === 1) {
          // Single playoff format
          goldTeams = sortedTeams.slice(0, goldSpots);
        } else if (playoffSpots.length === 2) {
          // Gold and Silver playoff format
          goldTeams = sortedTeams.slice(0, goldSpots);
          silverTeams = sortedTeams.slice(goldSpots, goldSpots + silverSpots);
        }

        return {
          tour,
          goldTeams: goldTeams.map((team, index) => ({
            ...team,
            playoffPosition: index + 1,
            playoffType: "gold" as const,
          })),
          silverTeams: silverTeams.map((team, index) => ({
            ...team,
            playoffPosition: index + 1,
            playoffType: "silver" as const,
          })),
          totalTeams: sortedTeams.length,
          playoffSpots,
        };
      });

      return {
        season,
        playoffsByTour,
      };
    }),
});
