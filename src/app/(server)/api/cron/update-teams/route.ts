/**
 * UPDATE-TEAMS API ROUTE
 * =====================
 *
 * Implements the update-teams cron per the spec in README.md. This initial
 * version wires the data loading + persistence and calls into a builder that
 * will be expanded to contain the actual calculations.
 */

import { NextResponse } from "next/server";
import {
  loadCurrentTournament,
  loadTourCardsForSeason,
  loadPlayoffCarryInMap,
  loadPlayoffEventIndex,
  batchUpdateTeams,
} from "./core/service";
import { buildTeamCalculations } from "./core/builder";

export async function GET() {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  try {
    const tournament = await loadCurrentTournament();
    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "No current tournament" },
        { status: 404 },
      );
    }

    const tourCards = await loadTourCardsForSeason(tournament.seasonId);
    if (!tourCards.length) {
      return NextResponse.json(
        { success: false, message: "No current tour cards" },
        { status: 404 },
      );
    }

    // Preload carry-in map for playoffs
    const carryInMap = await loadPlayoffCarryInMap(
      tournament.seasonId,
      tournament.startDate,
      tournament.tours.map((t) => t.id),
    );

    // Determine event index (1,2,3) by startDate ordering
    const eventIndex = await loadPlayoffEventIndex(
      tournament.seasonId,
      tournament.startDate,
      tournament.tours.map((t) => t.id),
    );

    const { teams } = await buildTeamCalculations(
      tournament,
      tourCards,
      carryInMap,
      eventIndex,
    );

    const updated = await batchUpdateTeams(teams);

    const duration = Date.now() - start;
    return NextResponse.json(
      {
        success: true,
        message: "Teams updated successfully",
        stats: {
          totalTeams: tournament.teams.length,
          teamsUpdated: updated,
          tournamentName: tournament.name,
          currentRound: tournament.currentRound ?? 1,
          livePlay: tournament.livePlay ?? false,
          eventIndex,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "X-Timestamp": timestamp,
          "X-Duration": `${duration}ms`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
