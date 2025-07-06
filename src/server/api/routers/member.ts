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
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.member.findUnique({
        where: { id: input.memberId },
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
});
