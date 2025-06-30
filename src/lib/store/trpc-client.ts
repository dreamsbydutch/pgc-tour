/**
 * Simple fetch-based functions to get data for the persistent store
 * These functions call the tRPC HTTP endpoints directly
 */

// Helper to get base URL
function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Helper to make tRPC calls via fetch
async function trpcFetch(path: string, input?: any) {
  const baseUrl = getBaseUrl();
  const url = input
    ? `${baseUrl}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${baseUrl}/api/trpc/${path}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`tRPC call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result?.data || null;
}

/**
 * Utility functions to fetch data via tRPC for the persistent store
 */
export const fetchTRPCData = {
  /**
   * Fetch current season and related data
   */
  async getSeasonData() {
    try {
      // First fetch current season
      const currentSeason = await trpcFetch("season.getCurrent");

      if (!currentSeason) {
        return {
          currentSeason: null,
          tours: [],
          tiers: [],
          tournaments: [],
          tourCards: [],
          courses: [],
        };
      }

      // Then fetch related data in parallel (including courses)
      const [tours, tiers, tournaments, tourCards, courses] = await Promise.all(
        [
          trpcFetch("tour.getBySeason", { seasonID: currentSeason.id }),
          trpcFetch("tier.getBySeason", { seasonId: currentSeason.id }),
          trpcFetch("tournament.getBySeason", { seasonId: currentSeason.id }),
          trpcFetch("tourCard.getBySeason", { seasonId: currentSeason.id }),
          trpcFetch("course.getAll"), // Fetch all courses
        ],
      );

      return {
        currentSeason,
        tours: tours || [],
        tiers: tiers || [],
        tournaments: tournaments || [],
        tourCards: tourCards || [],
        courses: courses || [],
      };
    } catch (error) {
      console.error("Error fetching season data:", error);
      throw error;
    }
  },

  /**
   * Fetch current member data
   */
  async getMemberData() {
    try {
      const member = await trpcFetch("member.getSelf");
      return {
        member: member || null,
      };
    } catch (error) {
      console.error("Error fetching member data:", error);
      throw error;
    }
  },

  /**
   * Fetch past tournament data (teams and golfers)
   */
  async getPastData(seasonId: string) {
    try {
      const pastData = await trpcFetch("tournament.getPastData", { seasonId });
      return {
        teams: pastData?.teams || [],
        golfers: pastData?.golfers || [],
      };
    } catch (error) {
      console.error("Error fetching past data:", error);
      throw error;
    }
  },
};
