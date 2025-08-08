/**
 * PLAYOFF TEAM DUPLICATION AND UPDATE CRON JOB
 * =============================================
 *
 * Takes teams from the first playoff tournament and duplicates them for tournaments 2 and 3.
 * This ensures that all players who have teams in tournament 1 automatically get teams
 * in tournaments 2 and 3 with the same golfer selections, maintaining consistency across
 * the playoff series. Also updates all playoff tournament teams to ensure proper scoring.
 *
 * ENDPOINTS:
 * - Production: https://www.pgctour.ca/api/cron/create-playoff-teams
 * - Development: http://localhost:3000/api/cron/create-playoff-teams
 */

import { NextResponse } from "next/server";
import { db } from "@pgc-server";
import { updateAllTeamsOptimized } from "../update-teams/lib/service";

export async function GET(request: Request) {
  try {
    console.log("🚀 Starting playoff team creation...");

    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get("next") ?? "/";

    // Find all playoff tournaments for the current season
    const currentYear = new Date().getFullYear();
    const currentSeason = await db.season.findUnique({
      where: { year: currentYear },
    });

    if (!currentSeason) {
      console.log("❌ No current season found");
      return NextResponse.json({
        success: false,
        message: "No current season found",
      });
    }

    // Get all playoff tournaments (should be 3: FedEx St. Jude, BMW, TOUR Championship)
    const playoffTournaments = await db.tournament.findMany({
      where: {
        seasonId: currentSeason.id,
        tier: {
          name: {
            contains: "Playoff",
            mode: "insensitive",
          },
        },
      },
      include: {
        tier: true,
      },
      orderBy: { startDate: "asc" },
    });

    if (playoffTournaments.length === 0) {
      console.log("❌ No playoff tournaments found");
      return NextResponse.json({
        success: false,
        message: "No playoff tournaments found",
      });
    }

    console.log(`📊 Found ${playoffTournaments.length} playoff tournaments`);

    // Get the first playoff tournament
    const firstPlayoffTournament = playoffTournaments[0];
    if (!firstPlayoffTournament) {
      return NextResponse.json({
        success: false,
        message: "No first playoff tournament found",
      });
    }

    // Check if the first playoff tournament has started or is about to start (within 1 day)
    const now = new Date();
    const startDate = new Date(firstPlayoffTournament.startDate);
    const msUntilStart = startDate.getTime() - now.getTime();
    const daysUntilStart = msUntilStart / (1000 * 60 * 60 * 24);

    if (daysUntilStart > 1) {
      console.log(
        `⏰ First playoff tournament starts in ${daysUntilStart.toFixed(1)} days, not creating teams yet`,
      );
      return NextResponse.json({
        success: true,
        message: `First playoff tournament starts in ${daysUntilStart.toFixed(1)} days`,
      });
    }

    // Get all playoff-eligible tour cards
    const playoffTourCards = await db.tourCard.findMany({
      where: {
        seasonId: currentSeason.id,
        playoff: {
          gt: 0, // Gold (1) or Silver (2) playoff
        },
      },
      include: {
        member: true,
        tour: true,
      },
    });

    console.log(
      `👥 Found ${playoffTourCards.length} playoff-eligible tour cards`,
    );

    let teamsCreated = 0;
    let teamsAlreadyExist = 0;

    // Get teams from the first playoff tournament to duplicate
    const firstTournament = playoffTournaments[0];
    if (!firstTournament) {
      throw new Error("No first playoff tournament found");
    }

    const firstTournamentTeams = await db.team.findMany({
      where: {
        tournamentId: firstTournament.id,
      },
      include: {
        tourCard: {
          include: {
            member: true,
            tour: true,
          },
        },
      },
    });

    console.log(
      `📋 Found ${firstTournamentTeams.length} teams in first tournament to duplicate`,
    );

    // For tournaments 2 and 3, duplicate teams from tournament 1
    for (let i = 1; i < playoffTournaments.length; i++) {
      const tournament = playoffTournaments[i];
      if (!tournament) continue;

      console.log(`🔄 Creating teams for tournament: ${tournament.name}`);

      for (const firstTeam of firstTournamentTeams) {
        // Check if team already exists in this tournament
        const existingTeam = await db.team.findFirst({
          where: {
            tournamentId: tournament.id,
            tourCardId: firstTeam.tourCardId,
          },
        });

        if (existingTeam) {
          teamsAlreadyExist++;
          continue;
        }

        // Create team with same golfer list as first tournament
        await db.team.create({
          data: {
            tournamentId: tournament.id,
            tourCardId: firstTeam.tourCardId,
            golferIds: firstTeam.golferIds, // Copy golfer selection from first tournament
            round: 1,
            score: null,
            position: "1",
            pastPosition: "1",
            points: 0,
            earnings: 0,
          },
        });

        teamsCreated++;
      }
    }

    console.log(`✅ Playoff team duplication completed:`);
    console.log(`   - Teams created: ${teamsCreated}`);
    console.log(`   - Teams already existed: ${teamsAlreadyExist}`);
    console.log(`   - Source tournament: ${firstTournament.name}`);
    console.log(
      `   - Teams duplicated from: ${firstTournamentTeams.length} existing teams`,
    );
    console.log(`   - Target tournaments: ${playoffTournaments.length - 1}`);

    // After creating teams, update all playoff tournaments to ensure proper scoring
    console.log(`🔄 Updating teams for all playoff tournaments...`);
    let tournamentsUpdated = 0;
    let totalTeamsUpdated = 0;

    for (const tournament of playoffTournaments) {
      try {
        // Get the full tournament data needed for team updates
        const tournamentWithRelations = await db.tournament.findUnique({
          where: { id: tournament.id },
          include: {
            teams: true,
            golfers: true,
            course: true,
            tier: true,
            tours: true,
          },
        });

        if (tournamentWithRelations) {
          // Get tour cards for this tournament
          const tournamentTourCards = await db.tourCard.findMany({
            where: {
              seasonId: currentSeason.id,
              playoff: { gt: 0 },
            },
            include: {
              member: true,
              tour: true,
            },
          });

          // Update teams for this tournament
          const updateResult = await updateAllTeamsOptimized(
            tournamentWithRelations,
            tournamentTourCards,
          );

          if (updateResult.tournamentProcessed) {
            tournamentsUpdated++;
            totalTeamsUpdated += updateResult.teamsUpdated;
            console.log(
              `✅ Updated ${updateResult.teamsUpdated} teams for tournament: ${tournament.name}`,
            );
          }
        }
      } catch (updateError) {
        console.error(
          `❌ Error updating teams for tournament ${tournament.name}:`,
          updateError,
        );
      }
    }

    console.log(`✅ Team updates completed:`);
    console.log(`   - Tournaments updated: ${tournamentsUpdated}`);
    console.log(`   - Total teams updated: ${totalTeamsUpdated}`);

    return NextResponse.json({
      success: true,
      message: "Playoff teams duplicated and updated successfully",
      data: {
        teamsCreated,
        teamsAlreadyExist,
        tournamentsProcessed: playoffTournaments.length,
        sourceTeams: firstTournamentTeams.length,
        targetTournaments: playoffTournaments.length - 1,
        tournamentsUpdated,
        totalTeamsUpdated,
      },
    });
  } catch (error) {
    console.error("❌ Error in playoff team creation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
