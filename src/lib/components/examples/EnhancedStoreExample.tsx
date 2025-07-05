/**
 * @fileoverview Comprehensive example demonstrating the enhanced seasonal store
 * Shows all CRUD operations, advanced filtering, sorting, and computed values
 */

"use client";

import React, { useState } from "react";
import {
  useSeasonalData,
  useSeasonalActions,
  useTournamentsGroupedByStatus,
  useFilteredTournaments,
  useFilteredTourCards,
  useSortedTourCards,
  useEarningsDistribution,
  useTourStats,
  useDataSummary,
  useAllCourses,
  useTournamentCountByTier,
  useMemberCountByTour,
  useSearchTournaments,
  useSearchTourCards,
  useBatchActions,
  type TournamentFilters,
  type TourCardFilters,
  type SortDirection,
  type MinimalTourCard,
} from "@/lib/store/seasonalStoreHooks";

export function EnhancedStoreExample() {
  // Get basic data
  const { tournaments, allTourCards, tours, tiers } = useSeasonalData();
  const actions = useSeasonalActions();
  const batchActions = useBatchActions();

  // State for filtering and sorting
  const [tournamentFilters, setTournamentFilters] = useState<TournamentFilters>(
    {},
  );
  const [tourCardFilters, setTourCardFilters] = useState<TourCardFilters>({});
  const [sortKey, setSortKey] = useState<keyof MinimalTourCard>("earnings");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  // Get computed data
  const tournamentsGrouped = useTournamentsGroupedByStatus();
  const filteredTournaments = useFilteredTournaments(tournamentFilters);
  const filteredTourCards = useFilteredTourCards(tourCardFilters);
  const sortedTourCards = useSortedTourCards(sortKey, sortDirection);
  const earningsDistribution = useEarningsDistribution();
  const tourStats = useTourStats();
  const dataSummary = useDataSummary();
  const allCourses = useAllCourses();
  const tournamentCountByTier = useTournamentCountByTier();
  const memberCountByTour = useMemberCountByTour();

  // Search results
  const searchedTournaments = useSearchTournaments(searchQuery);
  const searchedTourCards = useSearchTourCards(searchQuery);

  // Example handlers for CRUD operations
  const handleUpdateTournament = (id: string) => {
    actions.updateTournament(id, {
      name: "Updated Tournament Name",
      livePlay: true,
    });
  };

  const handleBatchUpdateTourCards = () => {
    const updates = [
      { id: "card1", updates: { earnings: 1000 } },
      { id: "card2", updates: { points: 100 } },
    ];
    batchActions.batchUpdateTourCards(updates);
  };

  const handleAddNewTour = () => {
    const newTour = {
      id: "new-tour-" + Date.now(),
      name: "New Tour",
      logoUrl: "",
      buyIn: 100,
      shortForm: "NT",
    };
    actions.addTour(newTour);
  };

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold">Enhanced Seasonal Store Demo</h1>

      {/* Data Summary */}
      <section className="rounded bg-gray-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">Data Summary</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-2xl font-bold">{dataSummary.tournaments}</div>
            <div className="text-gray-600">Tournaments</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{dataSummary.tourCards}</div>
            <div className="text-gray-600">Tour Cards</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{dataSummary.tours}</div>
            <div className="text-gray-600">Tours</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{dataSummary.dataSize}</div>
            <div className="text-gray-600">Data Size</div>
          </div>
        </div>
      </section>

      {/* Tournaments by Status */}
      <section className="rounded bg-blue-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">Tournaments by Status</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-medium text-green-700">
              Current ({tournamentsGrouped.current.length})
            </h3>
            <ul className="space-y-1">
              {tournamentsGrouped.current.map((t) => (
                <li key={t.id} className="text-sm">
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-700">
              Upcoming ({tournamentsGrouped.upcoming.length})
            </h3>
            <ul className="space-y-1">
              {tournamentsGrouped.upcoming.slice(0, 3).map((t) => (
                <li key={t.id} className="text-sm">
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">
              Past ({tournamentsGrouped.past.length})
            </h3>
            <ul className="space-y-1">
              {tournamentsGrouped.past.slice(0, 3).map((t) => (
                <li key={t.id} className="text-sm">
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Search and Filtering */}
      <section className="rounded bg-green-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">Search & Filter</h2>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tournaments and tour cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border p-2"
          />
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Found {searchedTournaments.length} tournaments and{" "}
              {searchedTourCards.length} tour cards
            </div>
          )}
        </div>

        {/* Tournament Filters */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Filter by Tier
            </label>
            <select
              value={tournamentFilters.tierIds?.[0] || ""}
              onChange={(e) =>
                setTournamentFilters((prev) => ({
                  ...prev,
                  tierIds: e.target.value ? [e.target.value] : undefined,
                }))
              }
              className="w-full rounded border p-2"
            >
              <option value="">All Tiers</option>
              {tiers?.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Filter by Status
            </label>
            <select
              value={tournamentFilters.status?.[0] || ""}
              onChange={(e) =>
                setTournamentFilters((prev) => ({
                  ...prev,
                  status: e.target.value ? [e.target.value as any] : undefined,
                }))
              }
              className="w-full rounded border p-2"
            >
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="current">Current</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Tour Card Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Min Earnings
            </label>
            <input
              type="number"
              placeholder="0"
              value={tourCardFilters.minEarnings || ""}
              onChange={(e) =>
                setTourCardFilters((prev) => ({
                  ...prev,
                  minEarnings: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Max Earnings
            </label>
            <input
              type="number"
              placeholder="No limit"
              value={tourCardFilters.maxEarnings || ""}
              onChange={(e) =>
                setTourCardFilters((prev) => ({
                  ...prev,
                  maxEarnings: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Active Only
            </label>
            <input
              type="checkbox"
              checked={tourCardFilters.hasEarnings || false}
              onChange={(e) =>
                setTourCardFilters((prev) => ({
                  ...prev,
                  hasEarnings: e.target.checked ? true : undefined,
                }))
              }
              className="p-2"
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Filtered results: {filteredTournaments.length} tournaments,{" "}
          {filteredTourCards.length} tour cards
        </div>
      </section>

      {/* Sorting */}
      <section className="rounded bg-purple-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">Sorting Tour Cards</h2>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Sort by</label>
            <select
              value={sortKey}
              onChange={(e) =>
                setSortKey(e.target.value as keyof MinimalTourCard)
              }
              className="w-full rounded border p-2"
            >
              <option value="earnings">Earnings</option>
              <option value="points">Points</option>
              <option value="position">Position</option>
              <option value="displayName">Name</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Direction</label>
            <select
              value={sortDirection}
              onChange={(e) =>
                setSortDirection(e.target.value as SortDirection)
              }
              className="w-full rounded border p-2"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing top 5 sorted by {String(sortKey)} ({sortDirection}):
        </div>
        <ul className="mt-2 space-y-1">
          {sortedTourCards.slice(0, 5).map((tc) => (
            <li key={tc.id} className="flex justify-between text-sm">
              <span>{tc.displayName}</span>
              <span>
                {sortKey === "earnings"
                  ? `$${tc.earnings}`
                  : sortKey === "points"
                    ? tc.points
                    : sortKey === "position"
                      ? tc.position
                      : sortKey === "displayName"
                        ? tc.displayName
                        : String(tc[sortKey])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Statistics */}
      <section className="rounded bg-yellow-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">Statistics</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Earnings Distribution */}
          <div>
            <h3 className="mb-2 font-medium">Earnings Distribution</h3>
            <div className="space-y-1 text-sm">
              <div>Total: ${earningsDistribution.total.toLocaleString()}</div>
              <div>
                Average: ${earningsDistribution.average.toLocaleString()}
              </div>
              <div>Median: ${earningsDistribution.median.toLocaleString()}</div>
              <div>
                Top 10%: ${earningsDistribution.top10Percent.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tour Stats */}
          <div>
            <h3 className="mb-2 font-medium">Tour Statistics</h3>
            <div className="space-y-1 text-sm">
              <div>Total Tours: {tourStats.totalTours}</div>
              <div>Total Buy-in: ${tourStats.totalBuyIn.toLocaleString()}</div>
              <div>Average Buy-in: ${tourStats.avgBuyIn.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Tournaments by Tier</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(tournamentCountByTier).map(([tierId, count]) => {
                const tier = tiers?.find((t) => t.id === tierId);
                return (
                  <div key={tierId} className="flex justify-between">
                    <span>{tier?.name || "Unknown"}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Members by Tour</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(memberCountByTour)
                .slice(0, 5)
                .map(([tourId, count]) => {
                  const tour = tours?.find((t) => t.id === tourId);
                  return (
                    <div key={tourId} className="flex justify-between">
                      <span>{tour?.shortForm || "Unknown"}</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      {/* CRUD Operations */}
      <section className="rounded bg-red-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">CRUD Operations</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() =>
              tournaments?.[0] && handleUpdateTournament(tournaments[0].id)
            }
            className="rounded bg-blue-500 p-3 text-white hover:bg-blue-600"
            disabled={!tournaments?.length}
          >
            Update First Tournament
          </button>

          <button
            onClick={handleBatchUpdateTourCards}
            className="rounded bg-green-500 p-3 text-white hover:bg-green-600"
          >
            Batch Update Tour Cards
          </button>

          <button
            onClick={handleAddNewTour}
            className="rounded bg-purple-500 p-3 text-white hover:bg-purple-600"
          >
            Add New Tour
          </button>
        </div>
      </section>

      {/* Course Information */}
      <section className="rounded bg-indigo-50 p-4">
        <h2 className="mb-3 text-xl font-semibold">
          Courses ({allCourses.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allCourses.slice(0, 6).map((course) => (
            <div key={course.id} className="rounded bg-white p-3 shadow-sm">
              <h4 className="font-medium">{course.name}</h4>
              <p className="text-sm text-gray-600">{course.location}</p>
              <p className="text-sm">Par {course.par}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
