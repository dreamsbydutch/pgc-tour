import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.member.findMany({});
  }),
  getById: publicProcedure
    .input(z.object({ memberId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.memberId) return null;
      return await ctx.db.member.findUnique({ where: { id: input.memberId } });
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().optional(),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        account: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: input.id },
        data: {
          account: input.account,
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
        },
      });
      return updatedUser;
    }),
});
