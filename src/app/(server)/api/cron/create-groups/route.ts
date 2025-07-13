/**
 * CREATE GROUPS CRON JOB
 * =======================
 *
 * Creates tournament groups by organizing golfers into skill-based tiers.
 * This endpoint is triggered by cron jobs to set up tournaments.
 *
 * BUSINESS RULES:
 * - Groups golfers by skill level using DataGolf rankings
 * - Group 1: Top 10% (max 10 golfers) - Elite tier
 * - Group 2: Next 17.5% (max 16 golfers) - Strong tier
 * - Group 3: Next 22.5% (max 22 golfers) - Solid tier
 * - Group 4: Next 25% (max 30 golfers) - Competitive tier
 * - Group 5: Remaining golfers - Developmental tier
 *
 * FLOW:
 * 1. Fetch golfer field and ranking data from DataGolf
 * 2. Filter and sort golfers by skill estimate
 * 3. Distribute golfers into groups based on percentages
 * 4. Create golfer records in database with group assignments
 * 5. Redirect to next cron job (update-golfers)
 */

import { handleCreateGroups } from "./lib";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleCreateGroups(request);
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Endpoints:
// http://localhost:3000/api/cron/create-groups
// https://www.pgctour.ca/api/cron/create-groups
