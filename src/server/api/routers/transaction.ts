import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.transactions.findMany();
  }),
  getByMember: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transactions.findMany({
        where: { userId: input.memberId },
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        amount: z.number(),
        description: z.string(),
        seasonId: z.string(),
        transactionType: z.enum([
          "TourCardFee",
          "TournamentWinnings",
          "Withdrawal",
          "LeagueDonation",
          "CharityDonation",
          "Payment",
        ]),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transactions.create({
        data: {
          amount: input.amount,
          description: input.description,
          seasonId: input.seasonId,
          transactionType: input.transactionType,
          userId: input.userId,
        },
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        transactionId: z.number(),
        amount: z.number().optional(),
        description: z.string().optional(),
        seasonId: z.string().optional(),
        transactionType: z
          .enum([
            "TourCardFee",
            "TournamentWinnings",
            "Withdrawal",
            "LeagueDonation",
            "CharityDonation",
            "Payment",
          ])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transactions.update({
        where: { id: input.transactionId },
        data: {
          amount: input.amount,
          description: input.description,
          seasonId: input.seasonId,
          transactionType: input.transactionType,
        },
      });
    }),
  delete: adminProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transactions.delete({
        where: { id: input.transactionId },
      });
    }),
});
