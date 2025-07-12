/**
 * TEAM SCORING UPDATE CRON JOB
 * ============================
 *
 * Updates team scores for the current tournament based on golfer performance.
 *
 * BUSINESS RULES:
 * - Rounds 1-2: Use ALL golfers on the team for scoring
 * - Rounds 3-4: Use TOP 5 golfers based on individual round scores (if team has ≥5 golfers)
 * - Teams with <5 golfers in rounds 3-4 are marked as "CUT"
 */

"use server";

import { api } from "@trpcLocal/server";
import { NextResponse } from "next/server";
import { updateAllTeams } from "./lib";

type TournamentWithCourse = Tournament & { course: Course };
type TeamWithScoring = Team & {
  golfers: Golfer[];
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  try {
    const tournament = (await api.tournament.getInfo()).current;
    if (!tournament) {
      return NextResponse.redirect(`${origin}/`);
    }

    const [golfers, teams] = await Promise.all([
      api.golfer.getByTournament({ tournamentId: tournament.id }),
      api.team.getByTournament({ tournamentId: tournament.id }),
    ]);

    await updateAllTeams(teams, tournament, golfers);

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error("Error updating teams:", error);
    return NextResponse.json(
      { error: "Failed to update teams" },
      { status: 500 },
    );
  }
}
