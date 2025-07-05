/**
 * @fileoverview Example component showing comprehensive store usage
 * Demonstrates all the new store features and best practices
 */

import { useState } from "react";
import {
  useCurrentTournament,
  useLeaderboard,
  useMyTourCard,
  useTournamentStats,
  useMemberStats,
  useTopEarners,
  useDataFreshness,
  useSeasonalActions,
  useSearchTournaments,
  useTournamentsByStatus,
} from "@/lib/store/seasonalStoreHooks";
import { formatMoney } from "@/lib/utils";

export function ComprehensiveStoreExample() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get data using convenience hooks
  const currentTournament = useCurrentTournament();
  const leaderboard = useLeaderboard();
  const myTourCard = useMyTourCard();
  const tournamentStats = useTournamentStats();
  const memberStats = useMemberStats();
  const topEarners = useTopEarners(5);
  const { isStale, age } = useDataFreshness();

  // Get actions
  const { updateTourCard, updateTournament } = useSeasonalActions();

  // Search functionality
  const searchResults = useSearchTournaments(searchQuery);
  const { current, upcoming, past } = useTournamentsByStatus();

  const handleUpdateEarnings = () => {
    if (myTourCard) {
      updateTourCard(myTourCard.id, {
        earnings: myTourCard.earnings + 1000,
        points: myTourCard.points + 10,
      });
    }
  };

  const handleTournamentLive = () => {
    if (currentTournament) {
      updateTournament(currentTournament.id, {
        livePlay: true,
        currentRound: 2,
      });
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header with data freshness */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">PGC Tour Dashboard</h1>
        <div className="text-sm text-gray-500">
          Data age: {Math.round(age / 1000 / 60)} minutes
          {isStale && <span className="ml-2 text-red-500">⚠️ Stale</span>}
        </div>
      </div>

      {/* Current Tournament */}
      {currentTournament && (
        <div className="rounded-lg bg-blue-50 p-4">
          <h2 className="text-xl font-semibold">Current Tournament</h2>
          <p className="text-lg">{currentTournament.name}</p>
          <p>Course: {currentTournament.course.name}</p>
          <p>Location: {currentTournament.course.location}</p>
          <p>Round: {currentTournament.currentRound || 1}</p>
          <button
            onClick={handleTournamentLive}
            className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
          >
            Mark Live (Round 2)
          </button>
        </div>
      )}

      {/* My Tour Card */}
      {myTourCard && (
        <div className="rounded-lg bg-green-50 p-4">
          <h2 className="text-xl font-semibold">My Performance</h2>
          <p>Name: {myTourCard.displayName}</p>
          <p>Earnings: {formatMoney(myTourCard.earnings)}</p>
          <p>Points: {myTourCard.points}</p>
          <p>Position: {myTourCard.position || "Unranked"}</p>
          <button
            onClick={handleUpdateEarnings}
            className="mt-2 rounded bg-green-500 px-4 py-2 text-white"
          >
            Add $1,000 Earnings
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-semibold">Total Tournaments</h3>
          <p className="text-2xl">{tournamentStats.total}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-semibold">Completed</h3>
          <p className="text-2xl">{tournamentStats.completed}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-semibold">Total Members</h3>
          <p className="text-2xl">{memberStats.totalMembers}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-semibold">Total Earnings</h3>
          <p className="text-2xl">{formatMoney(memberStats.totalEarnings)}</p>
        </div>
      </div>

      {/* Search */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Search Tournaments</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, course, or location..."
          className="w-full rounded border p-2"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {searchResults.map((tournament) => (
              <div key={tournament.id} className="rounded bg-gray-50 p-2">
                <span className="font-medium">{tournament.name}</span>
                <span className="ml-2 text-gray-600">
                  at {tournament.course.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Earners */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Top Earners</h2>
        <div className="space-y-2">
          {topEarners.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded bg-yellow-50 p-2"
            >
              <span>
                #{index + 1} {card.displayName}
              </span>
              <span className="font-semibold">
                {formatMoney(card.earnings)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Current Standings</h2>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {leaderboard.slice(0, 10).map((card, index) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded bg-white p-2 shadow-sm"
            >
              <span>
                #{index + 1} {card.displayName}
              </span>
              <div className="text-right">
                <div>{card.points} pts</div>
                <div className="text-sm text-gray-600">
                  {formatMoney(card.earnings)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <h3 className="mb-2 font-semibold">Current ({current.length})</h3>
          {current.map((t) => (
            <div key={t.id} className="rounded bg-blue-50 p-2 text-sm">
              {t.name}
            </div>
          ))}
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Upcoming ({upcoming.length})</h3>
          {upcoming.slice(0, 3).map((t) => (
            <div key={t.id} className="rounded bg-green-50 p-2 text-sm">
              {t.name}
            </div>
          ))}
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Past ({past.length})</h3>
          {past.slice(0, 3).map((t) => (
            <div key={t.id} className="rounded bg-gray-50 p-2 text-sm">
              {t.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
