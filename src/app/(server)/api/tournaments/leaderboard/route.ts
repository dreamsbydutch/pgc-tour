import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      where: { season: { year: new Date().getFullYear() } },
    });
    const currentTourn = tournaments.find(
      (tournament) =>
        new Date(tournament.startDate) <= new Date() &&
        new Date(tournament.endDate) >= new Date() &&
        (tournament.currentRound ?? 0) < 5,
    );
    const currentTournId = currentTourn?.id;
    if (!currentTournId) {
      return NextResponse.json(
        { error: "No current tournament found" },
        { status: 404 },
      );
    }
    const tournamentId = currentTournId;
    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        tourCard: true,
      },
      orderBy: { score: "asc" },
    });
    const golfers = await db.golfer.findMany({
      where: { tournamentId },
      orderBy: { score: "asc" },
    });

    // Create response with no-cache headers
    const response = NextResponse.json({ teams, golfers });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
