import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const transactionRouter = createTRPCRouter({
  getByMember: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.transactions.findMany({
        where: { userId: input.memberId },
      });
    }),

  create: publicProcedure
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
});
