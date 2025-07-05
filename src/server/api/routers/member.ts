import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.member.findMany({});
  }),
  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findUnique({
        where: { email: input.email },
      });
    }),
  getByLastName: publicProcedure
    .input(z.object({ lastname: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findMany({
        where: { lastname: input.lastname },
      });
    }),
  getSelf: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return await ctx.db.member.findUnique({
      where: { id: ctx.user.id },
    });
  }),
  getById: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.member.findUnique({
        where: { id: input.memberId },
      });
    }),
  create: protectedProcedure
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().optional(),
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
          email: input.email,
          firstname: input.firstname,
          lastname: input.lastname,
          friends: input.friends,
        },
      });
      return updatedUser;
    }),
  addFriend: protectedProcedure
    .input(
      z.object({
        friendId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: ctx.user.id },
        data: {
          friends: {
            push: input.friendId,
          },
        },
      });
      return updatedUser;
    }),
  removeFriend: protectedProcedure
    .input(
      z.object({
        friendsList: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.member.update({
        where: { id: ctx.user.id },
        data: {
          friends: {
            set: input.friendsList,
          },
        },
      });
      return updatedUser;
    }),
});
