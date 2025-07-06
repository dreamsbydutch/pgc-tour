import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const seasonRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.season.findMany({
      orderBy: { year: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.season.findUnique({
        where: { id: input.id },
        include: {
          tours: true,
          tournaments: true,
          tiers: true,
        },
      });
    }),

  getCurrent: publicProcedure.query(async ({ ctx }) => {
    const currentYear = new Date().getFullYear();
    return ctx.db.season.findUnique({
      where: { year: currentYear },
      include: {
        tours: true,
        tournaments: true,
        tiers: true,
      },
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
      return ctx.db.season.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        year: z.number().optional(),
        number: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.season.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.season.delete({ where: { id: input.id } });
    }),
});
