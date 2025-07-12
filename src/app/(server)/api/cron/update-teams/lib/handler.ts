/**
 * TEAM UPDATE HANDLER
 * ===================
 *
 * Handles team update requests and provides unified interface for:
 * - Optimized team updates using direct database queries
 * - Legacy team updates using TRPC API calls
 * - Error handling and request/response formatting
 */

import type { NextRequest } from "next/server";
import { updateAllTeamsOptimized } from "./service";
import type { TeamUpdateResult, TournamentWithCourse } from "./types";

/**
 * Main handler for team update requests
 */
export async function handleTeamUpdate(
  request: NextRequest,
): Promise<Response> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const { tournament, useOptimized = true } = body;

    if (!tournament) {
      return Response.json(
        { error: "Tournament data is required" },
        { status: 400 },
      );
    }

    // Validate tournament structure
    if (!tournament.id || !tournament.course) {
      return Response.json(
        { error: "Tournament must include id and course data" },
        { status: 400 },
      );
    }

    console.log(`🎯 Processing team update for tournament: ${tournament.name}`);

    let result: TeamUpdateResult;

    // Use optimized service (recommended)
    if (useOptimized) {
      result = await updateAllTeamsOptimized(
        tournament as TournamentWithCourse,
      );
    } else {
      // Legacy fallback would go here if needed
      throw new Error("Legacy team update not implemented in this version");
    }

    const totalDuration = Date.now() - startTime;

    // Log summary
    console.log(`📊 Team update summary:`, {
      tournament: tournament.name,
      success: result.success,
      teamsUpdated: result.teamsUpdated,
      fieldsUpdated: result.fieldsUpdated,
      databaseCalls: result.databaseCalls,
      duration: totalDuration,
    });

    // Return success response
    return Response.json({
      success: true,
      data: result,
      meta: {
        totalDuration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error("❌ Team update failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration: totalDuration,
    });

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: {
          totalDuration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Validate tournament data structure
 */
function validateTournament(
  tournament: any,
): tournament is TournamentWithCourse {
  return (
    tournament &&
    typeof tournament.id === "string" &&
    typeof tournament.name === "string" &&
    tournament.course &&
    typeof tournament.course.par === "number"
  );
}

/**
 * Get tournament summary for logging
 */
function getTournamentSummary(tournament: TournamentWithCourse) {
  return {
    id: tournament.id,
    name: tournament.name,
    currentRound: tournament.currentRound,
    livePlay: tournament.livePlay,
    courseName: tournament.course.name,
    coursePar: tournament.course.par,
  };
}
