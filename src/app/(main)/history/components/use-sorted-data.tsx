import { useMemo } from "react";

export interface Golfer {
  name: string;
  apps: number;
  wins: number;
  top5s: number;
  top10s: number;
  cutsMade: number;
  avgUsage: number | null;
  groupCounts: Record<number, number>;
  lowGroup: number | null;
  highGroup: number | null;
  averageWorldRanking: number | null;
  groupOne?: number | null;
  groupTwo?: number | null;  
  groupThree?: number | null;
  groupFour?: number | null;
  groupFive?: number | null;
}

interface UseSortedDataProps<T> {
  data: T[];
  sortBy: string;
  sortDirection: "asc" | "desc";
  pageSize: number;
  currentPage: number;
}

export function useSortedData<T>({
  data,
  sortBy,
  sortDirection,
  pageSize,
  currentPage,
}: UseSortedDataProps<T>) {
  return useMemo(() => {
    // Sort the data
    const sortedData = [...data].sort((a, b) => {
      // Get values based on sort column
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null) return sortDirection === "asc" ? 1 : -1;

      // Compare values based on direction
      if (sortDirection === "asc") {
        return typeof aValue === "string"
          ? aValue.localeCompare(String(bValue))
          : Number(aValue) - Number(bValue);
      } else {
        return typeof aValue === "string"
          ? String(bValue).localeCompare(String(aValue))
          : Number(bValue) - Number(aValue);
      }
    });

    // Calculate pagination values
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentPageData = sortedData.slice(startIndex, endIndex);

    return {
      sortedData,
      currentPageData,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [data, sortBy, sortDirection, pageSize, currentPage]);
}
