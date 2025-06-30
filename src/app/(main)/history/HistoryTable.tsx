"use client";

import { useState, useMemo } from "react";
import { api } from "@/src/trpc/react";
import { useAuth } from "@/src/lib/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/app/_components/ui/table";
import { Button } from "@/src/app/_components/ui/button";
import { formatMoney } from "@/src/lib/utils";

// Add type definitions
type SortColumn = "earnings" | "wins" | "apps";
type SortDirection = "asc" | "desc";

interface MemberStats {
  id: string;
  name: string;
  totalEarnings: number;
  adjustedEarnings: number;
  totalWins: number;
  totalApps: number;
  top5s: number;
  top10s: number;
  cutsMade: number;
  cutPercentage: string;
  avgEarnings: number;
  adjustedAvgEarnings: number;
}

/**
 * Simplified History Table Component
 *
 * Combines member statistics display with simplified data processing.
 * Uses the new auth system and reduces complexity from the original implementation.
 */
export function HistoryTable() {
  const [showAdjusted, setShowAdjusted] = useState<boolean>(false);
  const [showFriendsOnly, setShowFriendsOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortColumn>("earnings");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Get current user data from auth
  const { member: currentMember } = useAuth();

  // Fetch data using tRPC directly (simplified approach)
  const { data: members } = api.member.getAll.useQuery();
  const { data: teams } = api.team.getAll.useQuery(); // Fixed: use proper API call instead of undefined hook
  const { data: tournaments } = api.tournament.getAll.useQuery();
  const { data: currentTiers } = api.tier.getCurrent.useQuery();
  const { data: allTiers } = api.tier.getAll.useQuery();
  const { data: tourCards } = api.tourCard.getAll.useQuery();

  // Process member data with simplified logic
  const processedData = useMemo((): MemberStats[] => {
    if (
      !members ||
      !teams ||
      !tournaments ||
      !currentTiers ||
      !allTiers ||
      !tourCards
    ) {
      return [];
    }

    // Filter tournaments - only past tournaments, exclude playoffs except TOUR Championship
    const validTournaments = tournaments.filter((t) => {
      const isFinished = new Date(t.startDate) < new Date();
      const tier = allTiers.find((tier) => tier.id === t.tierId);
      const isValidTournament =
        t.name === "TOUR Championship" || tier?.name !== "Playoff";
      return isFinished && isValidTournament;
    });

    const memberStats: MemberStats[] = members
      .map((member) => {
        // Get teams for this member across all tournaments through TourCard relationship
        const memberTourCards = tourCards.filter(
          (tourCard) => tourCard.memberId === member.id,
        );
        const memberTeams = teams.filter((team) => {
          const tournament = validTournaments.find(
            (t) => t.id === team.tournamentId,
          );
          // Check if this team's tourCardId matches any of the member's tour cards
          const belongsToMember = memberTourCards.some(
            (tourCard) => tourCard.id === team.tourCardId,
          );
          return tournament && belongsToMember;
        });

        let totalEarnings = 0;
        let adjustedEarnings = 0;
        let totalWins = 0;
        const totalApps = memberTeams.length;
        let top5s = 0;
        let top10s = 0;
        let cutsMade = 0;

        // Calculate stats from teams
        memberTeams.forEach((team) => {
          const tournament = validTournaments.find(
            (t) => t.id === team.tournamentId,
          );
          if (!tournament) return;

          const tier = allTiers.find((t) => t.id === tournament.tierId);
          const currentTier = currentTiers.find((t) => t.name === tier?.name);

          if (team.earnings && team.earnings > 0) {
            totalEarnings += team.earnings;

            // Calculate adjusted earnings using current tier values
            if (tier && currentTier && tier.payouts && currentTier.payouts) {
              // Use the same payout position but with current tier payouts
              const position = parseInt(
                team.position?.replace("T", "") ?? "999",
              );
              const payoutIndex = Math.min(
                position - 1,
                currentTier.payouts.length - 1,
              );
              if (payoutIndex >= 0) {
                adjustedEarnings += currentTier.payouts[payoutIndex] ?? 0;
              }
            } else {
              adjustedEarnings += team.earnings;
            }

            // Count wins and finishes based on position
            const position = parseInt(team.position?.replace("T", "") ?? "999");
            if (position === 1) totalWins++;
            if (position <= 5) top5s++;
            if (position <= 10) top10s++;
            if (position > 0 && position < 999) cutsMade++;
          }
        });

        return {
          id: member.id,
          name: member.fullname,
          totalEarnings,
          adjustedEarnings,
          totalWins,
          totalApps,
          top5s,
          top10s,
          cutsMade,
          cutPercentage:
            totalApps > 0 ? ((cutsMade / totalApps) * 100).toFixed(1) : "0.0",
          avgEarnings: totalApps > 0 ? totalEarnings / totalApps : 0,
          adjustedAvgEarnings: totalApps > 0 ? adjustedEarnings / totalApps : 0,
        };
      })
      .filter((member) => member.totalApps > 0);

    // Apply friends filter if enabled
    const filteredData =
      showFriendsOnly && currentMember
        ? memberStats.filter(
            (member) =>
              member.id === currentMember.id ||
              currentMember.friends?.includes(member.id),
          )
        : memberStats;

    // Sort data
    return filteredData.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case "earnings":
          aValue = showAdjusted ? a.adjustedEarnings : a.totalEarnings;
          bValue = showAdjusted ? b.adjustedEarnings : b.totalEarnings;
          break;
        case "wins":
          aValue = a.totalWins;
          bValue = b.totalWins;
          break;
        case "apps":
          aValue = a.totalApps;
          bValue = b.totalApps;
          break;
        default:
          aValue = a.totalEarnings;
          bValue = b.totalEarnings;
      }

      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }, [
    members,
    teams,
    tournaments,
    currentTiers,
    allTiers,
    tourCards,
    showFriendsOnly,
    currentMember,
    sortBy,
    sortDirection,
    showAdjusted,
  ]);

  const handleSort = (column: SortColumn): void => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          All-Time Member Statistics
        </h1>
        <p className="mt-2 text-gray-600">
          Career earnings, wins, and performance metrics
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showFriendsOnly}
            onChange={(e) => setShowFriendsOnly(e.target.checked)}
            className="rounded"
          />
          <span>Friends Only</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showAdjusted}
            onChange={(e) => setShowAdjusted(e.target.checked)}
            className="rounded"
          />
          <span>Adjusted Values</span>
        </label>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("earnings")}
                  className="h-auto p-0 font-semibold"
                >
                  {showAdjusted ? "Adj. Earnings" : "Earnings"}
                  {sortBy === "earnings" &&
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
              <TableHead>Top 10s</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("apps")}
                  className="h-auto p-0 font-semibold"
                >
                  Apps
                  {sortBy === "apps" &&
                    (sortDirection === "desc" ? " ↓" : " ↑")}
                </Button>
              </TableHead>
              <TableHead>Cut %</TableHead>
              <TableHead>Avg. Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  {formatMoney(
                    showAdjusted
                      ? member.adjustedEarnings
                      : member.totalEarnings,
                  )}
                </TableCell>
                <TableCell>{member.totalWins}</TableCell>
                <TableCell>{member.top5s}</TableCell>
                <TableCell>{member.top10s}</TableCell>
                <TableCell>{member.totalApps}</TableCell>
                <TableCell>{member.cutPercentage}%</TableCell>
                <TableCell>
                  {formatMoney(
                    showAdjusted
                      ? member.adjustedAvgEarnings
                      : member.avgEarnings,
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
