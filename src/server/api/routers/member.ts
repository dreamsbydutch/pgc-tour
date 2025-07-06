import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.member.findMany({
      orderBy: { lastname: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.member.findUnique({
        where: { id: input.id },
        include: { tourCards: true },
      });
    }),

  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.member.findUnique({
        where: { email: input.email },
      });
    }),

  getSelf: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.member.findUnique({
      where: { id: ctx.user.id },
      include: { tourCards: true },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string(),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        role: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.member.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        email: z.string().optional(),
        role: z.string().optional(),
        account: z.number().optional(),
        friends: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.member.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.member.delete({ where: { id: input.id } });
    }),
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
