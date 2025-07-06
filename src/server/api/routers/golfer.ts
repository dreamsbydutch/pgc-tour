import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const golferRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.golfer.findMany({
      include: { tournament: true },
      orderBy: { playerName: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findUnique({
        where: { id: input.id },
        include: { tournament: true },
      });
    }),

  getByTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.golfer.findMany({
        where: { tournamentId: input.tournamentId },
        include: { tournament: true },
        orderBy: { score: "asc" },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        apiId: z.number(),
        playerName: z.string(),
        tournamentId: z.string(),
        group: z.number().optional(),
        worldRank: z.number().optional(),
        rating: z.number().optional(),
        country: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.golfer.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        position: z.string().optional(),
        score: z.number().optional(),
        makeCut: z.number().optional(),
        topTen: z.number().optional(),
        win: z.number().optional(),
        today: z.number().optional(),
        thru: z.number().optional(),
        round: z.number().optional(),
        earnings: z.number().optional(),
        usage: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.golfer.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.golfer.delete({ where: { id: input.id } });
    }),
});
