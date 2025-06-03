/**
 * Tournament History Page
 *
 * This page displays historical tournament data for all members, including:
 * - Tournament results
 * - Earnings and points
 * - Adjusted earnings (based on current tier values)
 * - Championship/major achievements
 */
"use client";

import { useState } from "react";
import { useMainStore } from "@/src/lib/store/store";
import { api } from "@/src/trpc/react";
import {
  useProcessedTournaments,
  useProcessedTeams,
  useProcessedMemberData,
  useSortedMemberData,
} from "./components/data-hooks";
import { HistoryTable } from "./components/history-table";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

// Import our refactored component
import { GolferStatsTable } from "./components/golfer-stats-table";

/**
 * History Page Component
 * Displays comprehensive historical data for all members and tournaments
 */
export default function HistoryPage() {
  return (
    <>
      <GolferStatsTable />
      <MemberStatsTable />
    </>
  );
}

function MemberStatsTable() {
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
    adjustedTeams: adjustedTeams.filter((team) => team !== undefined),
  }).filter((obj) => (obj.teams?.length ?? 0) > 0);

  // Get the current user from the store
  const currentUser = useMainStore((state) => state.currentMember);

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
      {/* Page Header */}{" "}
      <div className="mb-8">
        <h1 className="text-center font-yellowtail text-5xl">
          All-Time Member Statistics
        </h1>
        <p className="mt-2 text-center text-gray-500">
          Career earnings, wins, and performance metrics
        </p>
      </div>{" "}
      {/* Toggle Switches */}
      <div className="mb-6 flex items-center justify-end space-x-4">
        {/* Friends Only Toggle */}
        <label className="flex cursor-pointer items-center">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={showFriendsOnly}
              onChange={() => setShowFriendsOnly(!showFriendsOnly)}
            />
            <div className="peer-focus:ring-3 h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-blue-300"></div>
          </div>
          <span className="mx-2 text-2xs">Friends Only</span>
        </label>

        {/* Adjusted Earnings Toggle */}
        <label className="flex cursor-pointer items-center">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={showAdjusted}
              onChange={() => setShowAdjusted(!showAdjusted)}
            />
            <div className="peer-focus:ring-3 h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-blue-300"></div>
          </div>
          <span className="mx-2 text-2xs">Adjusted</span>
        </label>
      </div>{" "}
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
