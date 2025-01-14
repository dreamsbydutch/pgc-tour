import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const courseRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.course.findMany();
  }),
  // getById: publicProcedure
  //   .input(z.object({ courseID: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     return ctx.db.course.findUnique({where: {apiId:input.courseID}});
  //   }),
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.course.findUnique({ where: { name: input.name } });
    }),

  create: publicProcedure
    .input(
      z.object({
        apiId: z.string(),
        name: z.string().min(1),
        location: z.string().min(1),
        par: z.number(),
        front: z.number(),
        back: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.course.create({
        data: {
          apiId: input.apiId,
          name: input.name,
          location: input.location,
          par: input.par,
          front: input.front,
          back: input.back,
        },
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.course.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return post ?? null;
  }),
});
