import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tournamentDataInclude } from "@/src/types/prisma_include";

export const tournamentRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tournament.findMany({
      orderBy: { startDate: "asc" },
    });
  }),
  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findMany({
        where: { seasonId: input.seasonId },
        include: tournamentDataInclude,
        orderBy: { startDate: "asc" },
      });
    }),
  getById: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: tournamentDataInclude,
      });
    }),
  getInfo: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return {
      current: await ctx.db.tournament.findFirst({
        where: { startDate: { lte: today }, endDate: { gte: today } },
        orderBy: { startDate: "desc" },
        include: tournamentDataInclude,
      }),
      past: await ctx.db.tournament.findFirst({
        where: { endDate: { lte: today } },
        orderBy: { startDate: "desc" },
        include: tournamentDataInclude,
      }),
      next: await ctx.db.tournament.findFirst({
        where: { startDate: { gte: today } },
        orderBy: { startDate: "asc" },
        include: tournamentDataInclude,
      }),
    };
  }),
  getActive: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db.tournament.findFirst({
      where: { startDate: { lte: today }, endDate: { gte: today } },
      include: tournamentDataInclude,
    });
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        livePlay: z.boolean().optional(),
        currentRound: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tournament.update({ where: { id: input.id }, data: input });
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        logoUrl: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        courseId: z.string(),
        tierId: z.string(),
        seasonId: z.string(),
        tourIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.create({
        data: {
          name: input.name,
          logoUrl: input.logoUrl,
          startDate: input.startDate,
          endDate: input.endDate,
          courseId: input.courseId,
          tierId: input.tierId,
          seasonId: input.seasonId,
          tours: {
            connect: input.tourIds
              .map((id) => (id ? { id } : undefined))
              .filter((tour): tour is { id: string } => tour !== undefined),
          },
        },
      });
    }),
  delete: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tournament.delete({ where: { id: input.tournamentId } });
    }),
});
