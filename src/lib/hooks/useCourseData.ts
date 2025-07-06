import { useQuery } from "@tanstack/react-query";
import { fetchDataGolf } from "@/lib/utils/system/api";
import type { DatagolfCourseInputData } from "@/lib/types/datagolf_types";

/**
 * Custom hook for fetching course data from DataGolf API
 *
 * @param enabled - Whether to fetch the data (useful for conditional fetching)
 * @returns Query result with course data, loading state, and error state
 */
export function useCourseData(enabled: boolean = true) {
  return useQuery({
    queryKey: ["course-data"],
    queryFn: async () => {
      const data = (await fetchDataGolf(
        "preds/live-hole-stats",
        {},
      )) as DatagolfCourseInputData;
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds for live data
  });
}
