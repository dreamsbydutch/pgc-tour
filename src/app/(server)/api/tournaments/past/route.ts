import { NextResponse } from "next/server";
import { db } from "@/src/server/db";
import { updateTeamPositions } from "@/src/app/(main)/history/utils/team-calculations";
import type { ExtendedTournament } from "@/src/app/(main)/history/types";

export async function GET() {
  try {
    // Get current date to filter past tournaments
    const now = new Date();
      // Query past tournaments with all related data
    const pastTournaments = await db.tournament.findMany({
      where: {
        OR: [
          { endDate: { lt: now } },
          { currentRound: { gte: 5 } }
        ]
      },
      include: {
        teams: {
          include: {
            tourCard: {
              include: {
                member: true
              }
            }
          }
        },
        course: true,
        golfers: true
      },
      orderBy: [
        { startDate: 'desc' }
      ]
    });    // Get golfers for all tournaments
    const golfersByTournament = pastTournaments.map(tournament => ({
      tournamentId: tournament.id,
      golfers: tournament.golfers
    }));

    // Get all tour cards for the seasons
    const seasonIds = [...new Set(pastTournaments.map(t => t.seasonId))];
    const allTourCards = await db.tourCard.findMany({
      where: {
        seasonId: { in: seasonIds }
      },
      include: {
        member: true
      }
    });

    // Get current tiers for calculations
    const currentTiers = await db.tier.findMany({
      where: {
        seasonId: { in: seasonIds }
      }
    });

    // Process tournaments to match ExtendedTournament format
    const processedTournaments: ExtendedTournament[] = pastTournaments.map(tournament => {
      // Get golfers for this tournament
      const tournamentGolfers = golfersByTournament.find(
        g => g.tournamentId === tournament.id
      )?.golfers ?? [];

      // Get tour cards for this tournament's teams
      const tournamentTourCards = allTourCards.filter(tc => 
        tournament.teams.some(team => team.tourCardId === tc.id)
      );

      // Get tier for this tournament
      const tier = currentTiers.find(t => t.id === tournament.tierId);

      // Calculate adjusted team positions using current tier values
      const adjustedTeams = updateTeamPositions(
        tournament.teams,
        tournamentTourCards,
        tier,
        tournament.name
      );      return {
        ...tournament,
        teams: tournament.teams,
        golfers: tournamentGolfers,
        courses: tournament.course ? [tournament.course] : [],
        tourCards: tournamentTourCards,
        adjustedTeams: adjustedTeams
      };
    });

    return NextResponse.json(processedTournaments);
  } catch (error) {
    console.error("Error fetching past tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch past tournaments" },
      { status: 500 }
    );
  }
}
