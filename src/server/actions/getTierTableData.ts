/**
 * @file getTierTableData.ts
 * @description
 *   Server action for fetching the current season's tiers from the API.
 *   Returns an array of Tier objects and any error encountered.
 *
 *   Usage:
 *     const { tiers, error } = await getTierTableData();
 */

import { api } from "@/trpc/server";
import type { Tier } from "@prisma/client";

/**
 * Fetches the current season's tiers from the API.
 *
 * @returns { tiers: Tier[]; error: unknown }
 *   - tiers: Array of Tier objects for the current season
 *   - error: Any error encountered during fetch (null if successful)
 *
 * @example
 *   const { tiers, error } = await getTierTableData();
 *   if (error) { ... }
 */
export async function getTierTableData(): Promise<{
  tiers: Tier[];
  error: unknown;
}> {
  try {
    const tiers = await api.tier.getCurrent();
    return { tiers, error: null };
  } catch (error) {
    return { tiers: [], error };
  }
}
