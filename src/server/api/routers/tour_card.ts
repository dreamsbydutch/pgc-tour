import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { createClient } from "@/src/lib/supabase/server";
import { tourCardDataInclude } from "@/src/types/prisma_include";

export const tourCardRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tourCard.findMany();
  }),

  getByDisplayName: publicProcedure
    .input(z.object({ name: z.string(), seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findFirst({
        where: { displayName: input.name, seasonId: input.seasonId },
      });
    }),

  getById: publicProcedure
    .input(z.object({ tourCardId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tourCard.findUnique({
        where: { id: input.tourCardId },
        include: tourCardDataInclude,
      });
    }),

  getByUserId: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.userId) return;
      return await ctx.db.tourCard.findMany({
        where: { memberId: input.userId },
        include: tourCardDataInclude,
      });
    }),

  getBySeason: publicProcedure
    .input(z.object({ seasonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.tourCard.findMany({
        where: { seasonId: input.seasonId },
        include: tourCardDataInclude,
      });
    }),

  getByTourId: publicProcedure
    .input(z.object({ tourId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.tourId) return;
      return await ctx.db.tourCard.findMany({
        where: { tourId: input.tourId },
      });
    }),
  getOwnBySeason: publicProcedure
    .input(
      z.object({
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();
      const user = await supabase.auth.getUser();
      if (!user) return null;
      const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: user.data.user?.id,
        },
        include: tourCardDataInclude,
      });
    }),
  getAllCurrent: publicProcedure.query(async ({ ctx }) => {
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
      },
      include: tourCardDataInclude,
    });
  }),

  getOwnCurrent: publicProcedure.query(async ({ ctx }) => {
    const supabase = await createClient();
    const user = await supabase.auth.getUser();
    if (!user) return null;
    const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
    return await ctx.db.tourCard.findFirst({
      where: {
        seasonId: season?.id,
        memberId: user.data.user?.id,
      },
      include: tourCardDataInclude,
    });
  }),

  getByUserSeason: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        seasonId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.userId) return;
      const season = await ctx.db.season.findUnique({ where: { year: 2025 } });
      return await ctx.db.tourCard.findFirst({
        where: {
          seasonId: input.seasonId ?? season?.id,
          memberId: input.userId,
        },
        include: tourCardDataInclude,
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
      return await ctx.db.tourCard.create({
        data: {
          seasonId: input.seasonId,
          displayName: input.displayName,
          tourId: input.tourId,
          memberId: input.memberId,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        displayName: z.string().optional(),
        earnings: z.number().optional(),
        points: z.number().optional().nullish(),
        position: z.string().optional().nullish(),
        appearances: z.number().optional(),
        topTen: z.number().optional(),
        win: z.number().optional(),
        madeCut: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.update({
        where: { id: input.id },
        data: {
          earnings: input.earnings,
          points: input.points,
          position: input.position,
          displayName: input.displayName,
          appearances: input.appearances,
          topTen: input.topTen,
          win: input.win,
          madeCut: input.madeCut,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ tourCardId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tourCard.delete({
        where: { id: input.tourCardId },
      });
    }),
});
