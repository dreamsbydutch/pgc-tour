import { api } from "@/trpc/react";

export function useTierTableData() {
  const { data: tiers, error, isLoading } = api.tier.getCurrent.useQuery();

  if (error) {
    console.error("Error fetching tier data:", error);
    return { tiers: [], isLoading, error };
  }

  return { tiers: tiers || [], isLoading, error: null };
}
