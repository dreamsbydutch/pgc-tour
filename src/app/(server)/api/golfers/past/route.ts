import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const date = new Date();
    
    // Get season first to ensure it exists
    const season = await db.season.findFirst({
      where: { year: date.getFullYear() },
    });
    
    if (!season) {
      console.log("No season found for current year");
      return NextResponse.json({ pastGolfers: [] });
    }
    
    const seasonTournamentInfo = await db.tournament.findMany({
      where: {
        seasonId: season.id,
      },
    });
    
    console.log(`Found ${seasonTournamentInfo.length} tournaments for the season`);
    
    const pastTournaments = seasonTournamentInfo.filter(
      (tournament) => new Date(tournament.endDate) < date,
    );
    
    console.log(`Found ${pastTournaments.length} past tournaments`);
    
    const pastGolfers = (
      await Promise.all(
        pastTournaments.map(async (tournament) => {
          const tournamentGolfers = await db.golfer.findMany({
            where: {
              tournamentId: tournament.id,
            },
          });
          console.log(`Found ${tournamentGolfers.length} golfers for tournament ${tournament.id}`);
          return tournamentGolfers;
        }),
      )
    ).flat();
    
    console.log(`Returning ${pastGolfers.length} total past golfers`);
    return NextResponse.json({ pastGolfers });
  } catch (error) {
    console.error("Error fetching golfer info:", error);
    return NextResponse.json(
      { error: "Failed to fetch golfer information" },
      { status: 500 },
    );
  }
}
