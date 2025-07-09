import { z } from "zod";
import { TransactionType } from "@prisma/client";

import {
  publicProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.transactions.findMany({
      orderBy: { id: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transactions.findUnique({
        where: { id: input.id },
      });
    }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transactions.findMany({
        where: { userId: input.userId },
        orderBy: { id: "desc" },
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transactions.findMany({
        where: { seasonId: input.seasonId },
        orderBy: { id: "desc" },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        seasonId: z.string(),
        description: z.string(),
        amount: z.number(),
        transactionType: z.nativeEnum(TransactionType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transactions.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        description: z.string().optional(),
        amount: z.number().optional(),
        transactionType: z.nativeEnum(TransactionType).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.transactions.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transactions.delete({ where: { id: input.id } });
    }),
});
