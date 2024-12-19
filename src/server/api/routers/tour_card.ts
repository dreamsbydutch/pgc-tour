import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ tournamentID: z.string() }))
    .query(() => {
      return {};
    }),
  // getById: publicProcedure
  //   .input(z.object({ courseID: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     return ctx.db.course.findUnique({where: {apiId:input.courseID}});
  //   }),
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        seasonId: z.string().min(1),
        email: z.string().min(1),
        displayName: z.string().min(1),
        fullName: z.string().min(1),
        buyin: z.number().min(1),
        tourId: z.string().min(1),
        memberId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingMember = await ctx.db.member.findUnique({
        where: { id: input.memberId },
      });
      if (!existingMember) return;
      await ctx.db.transactions.create({
        data: {
          amount: input.buyin,
          seasonId: input.seasonId,
          transactionType: "TourCardFee",
          userId: input.memberId,
          description: input.fullName + "'s Tour Card Fee",
        },
      });
      await ctx.db.member.update({
        where: { id: input.memberId },
        data: { account: existingMember.account + input.buyin },
      });
      await ctx.db.tourCard.create({
        data: {
          seasonId: input.seasonId,
          displayName: input.displayName,
          tourId: input.tourId,
          memberId: input.memberId,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ tourCardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.delete({ where: { id: input.tourCardId } });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.course.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return post ?? null;
  }),
});
