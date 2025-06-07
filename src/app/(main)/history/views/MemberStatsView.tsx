/**
 * Member Statistics View Component
 * 
 * Displays comprehensive historical data for all members including:
 * - Career earnings and points tracking
 * - Tournament participation and performance metrics
 * - Championship and major tournament achievements
 * - Win/loss records and placement statistics
 * 
 * Features:
 * - Toggle between regular and adjusted earnings/points
 * - Friends-only filtering for personalized views
 * - Comprehensive sorting and pagination
 * - Real-time data processing with custom hooks
 * 
 * Data Processing:
 * - Fetches tournament, member, tier, and tour card data
 * - Processes tournaments excluding future dates and playoff tiers
 * - Calculates both regular and adjusted team statistics
 * - Applies friend filtering based on current user relationships
 * 
 * State Management:
 * - showAdjusted: Toggle for adjusted earnings calculation
 * - showFriendsOnly: Filter for friends and current user only
 * - Uses memoized hooks for optimal performance
 * 
 * @component
 */
"use client";

import { useState } from "react";
import { useMainStore } from "@/src/lib/store/store";
import { api } from "@/src/trpc/react";
import { useAuth } from "@/src/lib/auth/Auth";
import {
  useProcessedTournaments,
  useProcessedTeams,
  useProcessedMemberData,
  useSortedMemberData,
} from "../components/hooks/data-hooks";
import { HistoryTable } from "../components/tables/history-table";
import { PageHeader } from "../components/ui/PageHeader";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";

export function MemberStatsView() {
  // State for toggling between regular and adjusted earnings/points
  const [showAdjusted, setShowAdjusted] = useState(false);
  // State for toggling between all members and friends only
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  // Get current tier data from store
  const currentTiers = useMainStore((state) => state.currentTiers);

  // Fetch all necessary data
  const { data: tourCards } = api.tourCard.getAll.useQuery();
  const { data: tiers } = api.tier.getAll.useQuery();
  const { data: inputTournaments } = api.tournament.getAll.useQuery();
  const { data: members } = api.member.getAll.useQuery();

  // Process data using custom hooks
  const tournaments = useProcessedTournaments({
    inputTournaments: inputTournaments?.filter(
      (t) =>
        new Date(t.startDate) < new Date() &&
        (t.name === "TOUR Championship" ||
          tiers?.find((ti) => ti.id === t.tierId)?.name !== "Playoff"),
    ),
    tiers,
    tourCards,
    currentTiers: currentTiers ?? undefined,
  });

  const { teams, adjustedTeams } = useProcessedTeams(tournaments);
  const memberData = useProcessedMemberData({
    members,
    tourCards,
    teams: teams.filter((team) => team !== undefined),
    adjustedTeams: adjustedTeams.filter((team) => team !== undefined),  }).filter((obj) => (obj.teams?.length ?? 0) > 0);

  // Get the current user from auth
  const { member: currentUser } = useAuth();

  // Filter member data by friends if needed
  const filteredMemberData = showFriendsOnly
    ? [
        ...memberData.filter((member) =>
          currentUser?.friends?.includes(member.id),
        ),
        ...memberData.filter((member) => currentUser?.id === member.id),
      ]
    : memberData;

  const sortedMemberData = useSortedMemberData(
    filteredMemberData,
    showAdjusted,
  );

  return (
    <div className="mx-auto w-full px-4 py-8">
      <PageHeader
        title="All-Time Member Statistics"
        description="Career earnings, wins, and performance metrics"
      />

      {/* Toggle Controls */}
      <div className="mb-6 flex items-center justify-end space-x-4">
        <ToggleSwitch
          checked={showFriendsOnly}
          onChange={setShowFriendsOnly}
          label="Friends Only"
          id="friends-toggle"
        />
        <ToggleSwitch
          checked={showAdjusted}
          onChange={setShowAdjusted}
          label="Adjusted"
          id="adjusted-toggle"
        />
      </div>

      {/* History Table Component */}
      <HistoryTable
        sortedMemberData={sortedMemberData}
        tournaments={tournaments}
        showAdjusted={showAdjusted}
        tiers={tiers}
        members={members}
      />
    </div>
  );
}
