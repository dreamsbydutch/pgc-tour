import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tourCard.findMany({
      include: {
        member: true,
        season: true,
        tour: true,
      },
      orderBy: { points: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({
        where: { id: input.id },
        include: {
          member: true,
          season: true,
          tour: true,
          teams: {
            include: { tournament: true },
          },
        },
      });
    }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { memberId: input.memberId },
        include: {
          season: true,
          tour: true,
          teams: {
            include: { tournament: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        include: {
          member: true,
          tour: true,
        },
        orderBy: { points: "desc" },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        displayName: z.string().min(1),
        memberId: z.string(),
        tourId: z.string(),
        seasonId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tourCard.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional(),
        win: z.number().optional(),
        topTen: z.number().optional(),
        madeCut: z.number().optional(),
        appearances: z.number().optional(),
        playoff: z.number().optional(),
        position: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tourCard.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tourCard.delete({ where: { id: input.id } });
    }),
});
