import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ tournamentID: z.string() }))
    .query(() => {
      return {};
    }),
});
