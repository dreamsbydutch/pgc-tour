import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.season.findMany({});
  }),

  getByYear: publicProcedure
    .input(z.object({ year: z.number().min(2021) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.season.findUnique({ where: { year: input.year } });
    }),

  getCurrent: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.season.findUnique({
      where: { year: new Date().getFullYear() },
    });
  }),

  create: publicProcedure
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
});
