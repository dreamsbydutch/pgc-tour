/**
 * @file server/index.ts
 * @description Central export file for all server-side functionality
 *
 * This file re-exports all server functions, routers, procedures, and utilities
 * for easier importing throughout the application.
 */

// ============= DATABASE =============

export { db } from "./db";

// ============= TRPC CORE =============

export {
  createTRPCContext,
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "./api/trpc";

export { appRouter, createCaller, type AppRouter } from "./api/root";

// ============= ROUTERS =============

export { courseRouter } from "./api/routers/course";
export { golferRouter } from "./api/routers/golfer";
export { memberRouter } from "./api/routers/member";
export { pushSubscriptionRouter } from "./api/routers/pushSubscription";
export { seasonRouter } from "./api/routers/season";
export { storeRouter } from "./api/routers/store";
export { teamRouter } from "./api/routers/team";
export { tierRouter } from "./api/routers/tier";
export { tourRouter } from "./api/routers/tour";
export { tournamentRouter } from "./api/routers/tournament";
export { tourCardRouter } from "./api/routers/tour_card";
export { transactionRouter } from "./api/routers/transaction";
