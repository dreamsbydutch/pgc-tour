"use client";

import { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/functionalComponents/ui/table";
import { Button } from "@/lib/components/functionalComponents/ui/button";

interface GolferStats {
  id: string;
  name: string;
  appearances: number;
  wins: number;
  top5s: number;
  top10s: number;
  cutsMade: number;
  cutPercentage: string;
  avgFinish: number;
  seasons: string[];
}

/**
 * Optimized Golfer Statistics Table with proper caching
 */
export function GolferStatsTable() {
  const [sortBy, setSortBy] = useState<"appearances" | "wins" | "top10s">(
    "appearances",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch golfer statistics data using tRPC
  const {
    data: golferStats = [],
    isLoading: loading,
    error,
  } = api.golfer.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    select: (data) => {
      // Transform the raw golfer data into statistics
      const statsMap = new Map<string, GolferStats>();

      data.forEach((golfer) => {
        const key = golfer.playerName;
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            id: golfer.id.toString(),
            name: golfer.playerName,
            appearances: 0,
            wins: 0,
            top5s: 0,
            top10s: 0,
            cutsMade: 0,
            cutPercentage: "0",
            avgFinish: 0,
            seasons: [],
          });
        }

        const stats = statsMap.get(key)!;
        stats.appearances += 1;

        // Count wins (position "1" or "T1")
        if (golfer.position === "1" || golfer.position === "T1") {
          stats.wins += 1;
        }

        // Count top 5s (position 1-5 or T2-T5)
        const pos = parseInt(golfer.position?.replace("T", "") || "999");
        if (pos <= 5) {
          stats.top5s += 1;
        }

        // Count top 10s (position 1-10 or T2-T10)
        if (pos <= 10) {
          stats.top10s += 1;
        }

        // Count cuts made (not "CUT", "WD", "DQ")
        if (golfer.position && !["CUT", "WD", "DQ"].includes(golfer.position)) {
          stats.cutsMade += 1;
        }

        // Add season to seasons array if not already present
        if (
          golfer.tournament?.seasonId &&
          !stats.seasons.includes(golfer.tournament.seasonId)
        ) {
          stats.seasons.push(golfer.tournament.seasonId);
        }
      });

      // Calculate percentages and averages
      return Array.from(statsMap.values()).map((stats) => ({
        ...stats,
        cutPercentage:
          stats.appearances > 0
            ? ((stats.cutsMade / stats.appearances) * 100).toFixed(1)
            : "0",
      }));
    },
  });

  // Use the optimized hook that pre-computes statistics with aggressive caching

  // Only sort the pre-computed data
  const sortedStats = useMemo(() => {
    return [...golferStats].sort((a: GolferStats, b: GolferStats) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case "appearances":
          aValue = a.appearances;
          bValue = b.appearances;
          break;
        case "wins":
          aValue = a.wins;
          bValue = b.wins;
          break;
        case "top10s":
          aValue = a.top10s;
          bValue = b.top10s;
          break;
        default:
          aValue = a.appearances;
          bValue = b.appearances;
      }

      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }, [golferStats, sortBy, sortDirection]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Golfer Statistics
          </h2>
          <p className="mt-1 text-gray-600">Loading golfer data...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading golfer statistics...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Golfer Statistics
          </h2>
          <p className="mt-1 text-red-600">
            Error loading data: {error?.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  const handleSort = (column: "appearances" | "wins" | "top10s") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedStats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Golfer Statistics</h2>
        <p className="mt-1 text-gray-600">
          Individual golfer performance metrics
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Golfer</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("appearances")}
                  className="h-auto p-0 font-semibold"
                >
                  Appearances
                  {sortBy === "appearances" &&
                    (sortDirection === "desc" ? " ↓" : " ↑")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("wins")}
                  className="h-auto p-0 font-semibold"
                >
                  Wins
                  {sortBy === "wins" &&
                    (sortDirection === "desc" ? " ↓" : " ↑")}
                </Button>
              </TableHead>
              <TableHead>Top 5s</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("top10s")}
                  className="h-auto p-0 font-semibold"
                >
                  Top 10s
                  {sortBy === "top10s" &&
                    (sortDirection === "desc" ? " ↓" : " ↑")}
                </Button>
              </TableHead>
              <TableHead>Cut %</TableHead>
              <TableHead>Seasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((golfer: GolferStats, index: number) => (
              <TableRow key={golfer.id}>
                <TableCell className="font-medium">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell className="font-medium">{golfer.name}</TableCell>
                <TableCell>{golfer.appearances}</TableCell>
                <TableCell>{golfer.wins}</TableCell>
                <TableCell>{golfer.top5s}</TableCell>
                <TableCell>{golfer.top10s}</TableCell>
                <TableCell>{golfer.cutPercentage}%</TableCell>
                <TableCell>{golfer.seasons.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, sortedStats.length)} of{" "}
            {sortedStats.length} golfers
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
