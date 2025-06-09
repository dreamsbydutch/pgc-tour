import { NextResponse } from "next/server";
import { db } from "@/src/server/db";

export async function GET() {
  try {
    // Get current date to filter past tournaments
    const now = new Date();

    // Query past tournaments with minimal data - only what's needed
    const pastTournaments = await db.tournament.findMany({
      where: {
        OR: [{ endDate: { lt: now } }, { currentRound: { gte: 5 } }],
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        currentRound: true,
        tierId: true,
        seasonId: true,
        courseId: true, // Only select essential team data without deep nesting
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
            roundOne: true,
            roundTwo: true,
            roundThree: true,
            roundFour: true,
            tourCard: {
              select: {
                id: true,
                displayName: true,
                tourId: true,
                memberId: true,
                points: true,
                earnings: true,
                playoff: true,
                seasonId: true,
              },
            },
          },
        },
        golfers: {
          select: {
            id: true,
            apiId: true,
            country: true,
            score: true,
            group: true,
            playerName: true,
            position: true,
            posChange: true,
            rating: true,
            usage: true,
            worldRank: true,
            today: true,
            thru: true,
            round: true,
            endHole: true,
            roundOne: true,
            roundTwo: true,
            roundThree: true,
            roundFour: true,
          },
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
          },
        },
      },
      orderBy: [{ startDate: "desc" }],
    });

    // Return optimized data structure
    const optimizedTournaments = pastTournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      currentRound: tournament.currentRound,
      tierId: tournament.tierId,
      seasonId: tournament.seasonId,
      courseId: tournament.courseId,
      teams: tournament.teams,
      golfers: tournament.golfers,
      course: tournament.course,
    }));

    return NextResponse.json(optimizedTournaments);
  } catch (error) {
    console.error("Error fetching past tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch past tournaments" },
      { status: 500 },
    );
  }
}
