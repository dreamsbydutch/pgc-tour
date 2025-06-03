import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { teamRouter } from "./routers/team";
import { courseRouter } from "./routers/course";
import { seasonRouter } from "./routers/season";
import { tierRouter } from "./routers/tier";
import { tourRouter } from "./routers/tour";
import { tourCardRouter } from "./routers/tour_card";
import { tournamentRouter } from "./routers/tournament";
import { memberRouter } from "./routers/member";
import { transactionRouter } from "./routers/transaction";
import { golferRouter } from "./routers/golfer";
import { subscriptionRouter } from "./routers/subscription";
import { cacheRouter } from "./routers/cache";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  golfer: golferRouter,
  member: memberRouter,
  team: teamRouter,
  course: courseRouter,
  season: seasonRouter,
  tier: tierRouter,
  tour: tourRouter,
  tourCard: tourCardRouter,
  tournament: tournamentRouter,
  transaction: transactionRouter,
  subscription: subscriptionRouter,
  cache: cacheRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
