import { NextResponse } from "next/server";
import { db } from "@/src/server/db";

export async function GET() {
  try {
    // Get current date to filter past tournaments
    const now = new Date();
    
    // Query past tournaments with minimal data - only what's needed
    const pastTournaments = await db.tournament.findMany({
      where: {
        OR: [
          { endDate: { lt: now } },
          { currentRound: { gte: 5 } }
        ]
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        currentRound: true,
        tierId: true,
        seasonId: true,
        courseId: true,
        // Only select essential team data without deep nesting
        teams: {
          select: {
            id: true,
            tourCardId: true,
            golferIds: true,
            score: true,
            position: true,
            pastPosition: true,
            earnings: true,
            points: true,
            round: true,
            today: true,
            thru: true,
          }
        },
        // Basic course info only
        course: {
          select: {
            id: true,
            name: true,
            location: true,
            par: true,
            front: true,
            back: true,
          }
        }
      },
      orderBy: [
        { startDate: 'desc' }
      ],
      // Limit to prevent oversized responses - can add pagination later if needed
      take: 50
    });

    // Return optimized data structure
    const optimizedTournaments = pastTournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      currentRound: tournament.currentRound,
      tierId: tournament.tierId,
      seasonId: tournament.seasonId,
      courseId: tournament.courseId,
      teams: tournament.teams,
      course: tournament.course,
      // Note: Removed golfers, tourCards, and adjustedTeams to reduce payload size
      // These can be fetched separately when needed for detailed views
    }));

    return NextResponse.json(optimizedTournaments);
  } catch (error) {
    console.error("Error fetching past tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch past tournaments" },
      { status: 500 }
    );
  }
}
