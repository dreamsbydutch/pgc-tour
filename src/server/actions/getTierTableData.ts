import { api } from "@/trpc/server";
import type { Tier } from "@prisma/client";

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
