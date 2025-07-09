import { z } from "zod";

import {
  publicProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const pushSubscriptionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.pushSubscription.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.findUnique({
        where: { id: input.id },
      });
    }),

  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.findMany({
        where: { memberId: input.memberId },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.create({
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.delete({ where: { id: input.id } });
    }),
});
