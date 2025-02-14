import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const subscriptionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.subscription.findMany({});
  }),

  create: publicProcedure
    .input(
      z.object({
        keys: z.object({ p256dh: z.string(), auth: z.string() }),
        endpoint: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.subscription.create({
        data: {
          keys: input.keys,
          endpoint: input.endpoint,
          memberId: input.memberId,
        },
      });
      return null;
    }),
});
