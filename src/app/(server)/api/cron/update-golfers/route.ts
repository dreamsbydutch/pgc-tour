/**
 * GOLFER UPDATE CRON JOB
 * =======================
 *
 * Clean, focused cron job for updating golfer data from the Data Golf API.
 * Business logic is centralized in the services module with clear separation of concerns.
 *
 * ENDPOINTS:
 * - Production: https://www.pgctour.ca/api/cron/update-golfers
 * - Development: http://localhost:3000/api/cron/update-golfers
 */

import { handleGolferUpdateCron } from "@/lib/cron/golfer-update";

export async function GET(request: Request) {
  return Response.json(await handleGolferUpdateCron(request));
}

export const dynamic = "force-dynamic";
