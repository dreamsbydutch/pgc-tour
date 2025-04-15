import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { createClient } from "@/src/lib/supabase/server";
import { memberDataInclude } from "@/src/types/prisma_include";

export const memberRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.member.findMany({
      include: memberDataInclude,
    });
  }),
  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findUnique({
        where: { email: input.email },
        include: memberDataInclude,
      });
    }),
  getByLastName: publicProcedure
    .input(z.object({ lastname: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findMany({
        where: { lastname: input.lastname },
        include: memberDataInclude,
      });
    }),
  getSelf: publicProcedure.query(async ({ ctx }) => {
    const supabase = await createClient();
    const user = await supabase.auth.getUser();
    if (!user || !user.data.user) return null;
    return await ctx.db.member.findUnique({
      where: { id: user.data.user.id },
      include: memberDataInclude,
    });
  }),
  getById: publicProcedure
    .input(z.object({ memberId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.memberId) return null;
      return await ctx.db.member.findUnique({
        where: { id: input.memberId },
        include: memberDataInclude,
      });
    }),
  create: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string(),
        fullname: z.string(),
        firstname: z.string(),
        lastname: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.create({
        data: {
          id: input.id,
          fullname: input.fullname,
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
        },
      });
      return updatedUser;
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().optional(),
        fullname: z.string().optional(),
        firstname: z.string().nullable().optional(),
        lastname: z.string().nullable().optional(),
        account: z.number().optional(),
        friends: z.string().array().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: input.id },
        data: {
          account: input.account,
          fullname: input.fullname,
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
          friends: input.friends,
        },
      });
      return updatedUser;
    }),
});
