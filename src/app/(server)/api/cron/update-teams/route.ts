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

    // Determine Event 1 starting strokes per team for logging purposes
    const tierPoints = tournament.tier?.points ?? [];
    const participants = new Set(
      (tournament.teams ?? []).map((t) => t.tourCardId),
    );
    const goldStrokes = tierPoints.slice(0, 30);
    const silverStrokes = tierPoints.slice(0, 40); // match builder: first 40 entries

    const getStartingStrokes = (
      teamId: number,
    ): { bracket: "Gold" | "Silver"; strokes: number } | null => {
      if (eventIndex !== 1) return null;
      const rawTeam = tournament.teams.find((rt) => rt.id === teamId);
      const tc = tourCards.find((c) => c.id === rawTeam?.tourCardId);
      if (!tc || !participants.has(tc.id)) return null;
      const bracket = (tc.playoff ?? 0) === 2 ? "Silver" : "Gold";
      const sameBracket = tourCards
        .filter(
          (c) =>
            participants.has(c.id) &&
            (c.playoff ?? 0) === (bracket === "Silver" ? 2 : 1),
        )
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      const idx = sameBracket.findIndex((c) => c.id === tc.id);
      if (idx < 0) return { bracket, strokes: 0 };
      const source = bracket === "Gold" ? goldStrokes : silverStrokes;
      const myPts = tc.points ?? 0;
      const better = sameBracket.filter((c) => (c.points ?? 0) > myPts).length;
      const tied = sameBracket.filter((c) => (c.points ?? 0) === myPts).length;
      if (tied > 1) {
        const slice = source.slice(better, better + tied);
        const avg =
          slice.reduce((a, b) => a + (b ?? 0), 0) / (slice.length || 1);
        return { bracket, strokes: Math.round(avg * 10) / 10 };
      }
      return { bracket, strokes: source[better] ?? 0 };
    };

    teams
      .sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        return scoreA - scoreB;
      })
      .map((t) => {
        const rawTeam = tournament.teams.find((rt) => rt.id === t.id);
        const tourCard = tourCards.find((tc) => tc.id === rawTeam?.tourCardId);
        if (!tourCard) {
          console.warn(`No tour card found for team ${t.id}`);
          return;
        }
        const ss = getStartingStrokes(t.id);
        if ((tourCard.playoff ?? 0) === 1) {
          console.log(
            `${t.position} - ${tourCard?.displayName} - ${t.score} - ${t.today} - ${t.thru} - ${t.roundOne} - ${t.roundTwo} - ${t.roundThree} - ${t.roundFour}` +
              (ss ? ` - ${ss.bracket} Starting Strokes: ${ss.strokes}` : ""),
          );
        }
      });
    console.log("=====================");
    teams
      .sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        return scoreA - scoreB;
      })
      .map((t) => {
        const rawTeam = tournament.teams.find((rt) => rt.id === t.id);
        const tourCard = tourCards.find((tc) => tc.id === rawTeam?.tourCardId);
        if (!tourCard) {
          console.warn(`No tour card found for team ${t.id}`);
          return;
        }
        const ss = getStartingStrokes(t.id);
        if ((tourCard.playoff ?? 0) === 2) {
          console.log(
            `${t.position} - ${tourCard?.displayName} - ${t.score} - ${t.today} - ${t.thru} - ${t.roundOne} - ${t.roundTwo} - ${t.roundThree} - ${t.roundFour}` +
              (ss ? ` - ${ss.bracket} Starting Strokes: ${ss.strokes}` : ""),
          );
        }
      });
    // const updated = await batchUpdateTeams(teams);
    const updated = 0; // console-test mode: no DB writes

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
