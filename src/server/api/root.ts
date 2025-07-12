import {
  createCallerFactory,
  createTRPCRouter,
  teamRouter,
  courseRouter,
  seasonRouter,
  tierRouter,
  tourRouter,
  tourCardRouter,
  tournamentRouter,
  memberRouter,
  transactionRouter,
  golferRouter,
  storeRouter,
  pushSubscriptionRouter,
} from "@pgc-server";

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
  store: storeRouter,
  pushSubscription: pushSubscriptionRouter,
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
