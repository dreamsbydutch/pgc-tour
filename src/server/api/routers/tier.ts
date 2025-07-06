import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const tierRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tier.findMany({
      include: { season: true, tours: true },
      orderBy: { name: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tier.findUnique({
        where: { id: input.id },
        include: {
          season: true,
          tours: true,
          tournaments: true,
        },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tier.findMany({
        where: { seasonId: input.seasonId },
        include: { season: true, tours: true },
        orderBy: { name: "asc" },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        seasonId: z.string(),
        payouts: z.array(z.number()),
        points: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tier.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        payouts: z.array(z.number()).optional(),
        points: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tier.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tier.delete({ where: { id: input.id } });
    }),
});
