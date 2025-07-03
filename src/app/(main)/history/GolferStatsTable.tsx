"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import { Button } from "@/src/app/_components/ui/button";

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
          <p className="mt-1 text-red-600">Error loading data: {error}</p>
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
