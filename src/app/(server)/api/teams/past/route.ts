import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const date = new Date();
    // Get all previous tournaments from this season
    const season = await db.season.findFirst({
      where: { year: new Date().getFullYear() },
    });

    if (!season) {
      console.log("No season found for current year");
      return NextResponse.json({ pastTeams: [] });
    }

    const seasonTournamentInfo = await db.tournament.findMany({
      where: {
        seasonId: season.id,
      },
    });

    const pastTournaments = seasonTournamentInfo.filter(
      (tournament) => new Date(tournament.endDate) < date,
    );


    const pastTeams = (
      await Promise.all(
        pastTournaments.map(async (tournament) => {
          const teams = await db.team.findMany({
            where: {
              tournamentId: tournament.id,
            },
            include: { tourCard: true },
          });
          return teams;
        }),
      )
    ).flat();

    return NextResponse.json({ pastTeams });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
