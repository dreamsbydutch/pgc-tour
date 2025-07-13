/**
 * Navigation data hook
 * Optimized to fetch auth data only once and cache it properly
 */

import { api } from "@pgc-trpcClient";
import type { NavigationData } from "../types";
import { useHeaderUser } from "@pgc-auth";

/**
 * Custom hook for navigation data
 * Fetches user, member, and tour card data with proper caching
 */
export function useNavigationData(): NavigationData {
  const { user, member, isLoading: isAuthLoading } = useHeaderUser();

  // Only fetch tour cards if we have a member
  const { data: tourCards, isLoading: isLoadingTourCards } =
    api.tourCard.getByUserId.useQuery(
      { userId: member?.id ?? "" },
      {
        enabled: !!member?.id,
        retry: 3,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  return {
    user,
    member,
    tourCards: tourCards ?? [],
    champions: null, // TODO: Add champions API call when available
    isLoading: isAuthLoading || isLoadingTourCards,
  };
}
