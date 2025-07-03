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
});
