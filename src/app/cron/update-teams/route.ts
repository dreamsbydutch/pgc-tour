"use server";

import { simulateTournament } from "@/src/lib/simulator";
import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import type {
  DatagolfFieldInput,
  DataGolfLiveTournament,
} from "@/src/types/datagolf_types";
import { TeamData, TournamentData } from "@/src/types/prisma_include";
import { Golfer } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const liveData = (await fetchDataGolf(
    "preds/in-play",
    null,
  )) as DataGolfLiveTournament;
  const fieldData = (await fetchDataGolf(
    "field-updates",
    null,
  )) as DatagolfFieldInput;

  const tournament = await api.tournament.getCurrent();
  if (!tournament) return NextResponse.redirect(`${origin}/`);

  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });
  // Sort golfers by today, then thru, then score, then group
  golfers.sort(
    (a, b) =>
      (a.today ?? 0) - (b.today ?? 0) ||
      (a.thru ?? 0) - (b.thru ?? 0) ||
      (a.score ?? 0) - (b.score ?? 0) ||
      (a.group ?? 0) - (b.group ?? 0),
  );

  const teams = await api.team.getByTournament({ tournamentId: tournament.id });
  let updatedTeams = teams.map((team) =>
    updateTeamData(team, golfers, fieldData, liveData, tournament),
  );

  updatedTeams = simulateTournament(
    golfers,
    updatedTeams,
    tournament.course.par,
    50000,
  );
  updatedTeams = await updateTeamPositions(updatedTeams, tournament);

  return NextResponse.redirect(`${origin}${next}`);
}

// https://www.pgctour.ca/cron/update-teams
// http://localhost:3000/cron/update-teams

/*─────────────────────────────────────────────────────────────*
 *                  HELPER FUNCTIONS BELOW                   *
 *─────────────────────────────────────────────────────────────*/

/**
 * Updates a single team's data by assigning tee times and calculating stats.
 */
function updateTeamData(
  team: TeamData,
  golfers: Golfer[],
  fieldData: DatagolfFieldInput,
  liveData: DataGolfLiveTournament,
  tournament: TournamentData,
): TeamData {
  const updatedTeam: TeamData = {
    ...team,
    round:
      liveData.info.event_name === fieldData.event_name
        ? liveData.info.current_round
        : fieldData.current_round,
  };
  const teamGolfers = golfers.filter((g) => team.golferIds.includes(g.apiId));

  // Assign tee times for each round if the current value is not in the future.
  updatedTeam.roundOneTeeTime = assignTeeTime(
    team.roundOneTeeTime,
    teamGolfers,
    "roundOneTeeTime",
    0,
  );
  updatedTeam.roundTwoTeeTime = assignTeeTime(
    team.roundTwoTeeTime,
    teamGolfers,
    "roundTwoTeeTime",
    0,
  );
  updatedTeam.roundThreeTeeTime = assignTeeTime(
    team.roundThreeTeeTime,
    teamGolfers,
    "roundThreeTeeTime",
    5,
  );
  updatedTeam.roundFourTeeTime = assignTeeTime(
    team.roundFourTeeTime,
    teamGolfers,
    "roundFourTeeTime",
    5,
  );

  // Calculate team statistics depending on whether live play is enabled.
  if (!tournament.livePlay) {
    Object.assign(
      updatedTeam,
      calculateLiveTeamStats(updatedTeam, team, teamGolfers, tournament),
    );
  } else {
    Object.assign(
      updatedTeam,
      calculateNonLiveTeamStats(updatedTeam, team, teamGolfers, tournament),
    );
  }

  // Round numeric fields to one decimal place.
  updatedTeam.score = roundValue(updatedTeam.score);
  updatedTeam.today = roundValue(updatedTeam.today);
  updatedTeam.thru = roundValue(updatedTeam.thru);
  updatedTeam.roundOne = roundValue(updatedTeam.roundOne);
  updatedTeam.roundTwo = roundValue(updatedTeam.roundTwo);
  updatedTeam.roundThree = roundValue(updatedTeam.roundThree);
  updatedTeam.roundFour = roundValue(updatedTeam.roundFour);

  return updatedTeam;
}

/**
 * Returns a tee time from the sorted team golfers if the existing tee time is not in the future.
 */
function assignTeeTime(
  currentTeeTime: string | null | undefined,
  teamGolfers: Golfer[],
  teeTimeKey: keyof Golfer,
  sortIndex: number,
): string {
  if (!(new Date(currentTeeTime ?? "") > new Date())) {
    const sorted = teamGolfers.slice().sort((a, b) => {
      const aTime = a[teeTimeKey]
        ? new Date(a[teeTimeKey]).getTime()
        : Infinity;
      const bTime = b[teeTimeKey]
        ? new Date(b[teeTimeKey]).getTime()
        : Infinity;
      return aTime - bTime;
    });
    return sorted[sortIndex]?.[teeTimeKey]?.toString() ?? "";
  }
  return currentTeeTime ?? "";
}

/**
 * Calculates statistics for teams during live play.
 */
function calculateLiveTeamStats(
  updatedTeam: TeamData,
  team: TeamData,
  teamGolfers: Golfer[],
  tournament: TournamentData,
): Partial<TeamData> {
  if ((tournament.currentRound ?? 0) >= 3) {
    updatedTeam.today = average(teamGolfers.slice(0, 5), "today", 8);
    updatedTeam.thru = average(teamGolfers.slice(0, 5), "thru", 0);
    if (tournament.currentRound === 3) {
      updatedTeam.score =
        (team.roundOne ?? 0) -
        tournament.course.par +
        ((team.roundTwo ?? 0) - tournament.course.par) +
        (updatedTeam.today ?? 0);
    } else if (tournament.currentRound === 4) {
      updatedTeam.score =
        (team.roundOne ?? 0) -
        tournament.course.par +
        ((team.roundTwo ?? 0) - tournament.course.par) +
        ((team.roundThree ?? 0) - tournament.course.par) +
        (updatedTeam.today ?? 0);
    }
  } else {
    updatedTeam.today = average(teamGolfers, "today", 8, teamGolfers.length);
    updatedTeam.thru = average(teamGolfers, "thru", 0, teamGolfers.length);
    if (tournament.currentRound === 1) {
      updatedTeam.score = updatedTeam.today;
    } else if (tournament.currentRound === 2) {
      updatedTeam.score =
        (team.roundOne ?? 0) - tournament.course.par + (updatedTeam.today ?? 0);
    }
  }
  return updatedTeam;
}

/**
 * Calculates statistics for teams when live play is not active.
 */
function calculateNonLiveTeamStats(
  updatedTeam: TeamData,
  team: TeamData,
  teamGolfers: Golfer[],
  tournament: TournamentData,
): Partial<TeamData> {
  if (tournament.currentRound === 1 && (team.thru ?? 0) > 0) {
    updatedTeam.roundOne = average(
      teamGolfers,
      "roundOne",
      tournament.course.par + 8,
      teamGolfers.length,
    );
    updatedTeam.today =
      average(
        teamGolfers,
        "roundOne",
        tournament.course.par + 8,
        teamGolfers.length,
      ) - tournament.course.par;
    updatedTeam.thru = 18;
    updatedTeam.score =
      average(
        teamGolfers,
        "roundOne",
        tournament.course.par + 8,
        teamGolfers.length,
      ) - tournament.course.par;
  }
  if (tournament.currentRound === 2 && (team.thru ?? 0) > 0) {
    updatedTeam.roundTwo = average(
      teamGolfers,
      "roundTwo",
      tournament.course.par + 8,
      teamGolfers.length,
    );
    updatedTeam.today =
      average(
        teamGolfers,
        "roundTwo",
        tournament.course.par + 8,
        teamGolfers.length,
      ) - tournament.course.par;
    updatedTeam.thru = 18;
    updatedTeam.score =
      (team.roundOne ?? 0) -
      tournament.course.par +
      (average(
        teamGolfers,
        "roundTwo",
        tournament.course.par + 8,
        teamGolfers.length,
      ) -
        tournament.course.par);
  }
  if (tournament.currentRound === 3 && (team.thru ?? 0) > 0) {
    const sortedR3 = teamGolfers
      .slice()
      .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0));
    updatedTeam.roundThree = average(
      sortedR3.slice(0, 5),
      "roundThree",
      tournament.course.par + 8,
      5,
    );
    updatedTeam.today =
      average(
        sortedR3.slice(0, 5),
        "roundThree",
        tournament.course.par + 8,
        5,
      ) - tournament.course.par;
    updatedTeam.thru = 18;
    updatedTeam.score =
      (team.roundOne ?? 0) +
      (team.roundTwo ?? 0) -
      tournament.course.par * 2 +
      (average(
        sortedR3.slice(0, 5),
        "roundThree",
        tournament.course.par + 8,
        5,
      ) -
        tournament.course.par);
  }
  if (tournament.currentRound === 4 && (team.thru ?? 0) > 0) {
    const sortedR4 = teamGolfers
      .slice()
      .sort((a, b) => (a.roundFour ?? 0) - (b.roundFour ?? 0));
    updatedTeam.roundFour = average(
      sortedR4.slice(0, 5),
      "roundFour",
      tournament.course.par + 8,
      5,
    );
    updatedTeam.today =
      average(sortedR4.slice(0, 5), "roundFour", tournament.course.par + 8, 5) -
      tournament.course.par;
    updatedTeam.thru = 18;
    updatedTeam.score =
      (team.roundOne ?? 0) +
      (team.roundTwo ?? 0) +
      (team.roundThree ?? 0) -
      tournament.course.par * 3 +
      (average(
        sortedR4.slice(0, 5),
        "roundFour",
        tournament.course.par + 8,
        5,
      ) -
        tournament.course.par);
  }
  return updatedTeam;
}

/**
 * Calculates an average for a given key from an array of objects.
 */
function average(
  arr: Record<string | number, number | string | Date | null | undefined>[],
  key: string,
  defaultValue: number,
  count?: number,
): number {
  const n = count ?? arr.length;
  if (n === 0) return defaultValue;
  const total = arr.reduce(
    (sum, item) =>
      sum + (typeof item[key] === "number" ? item[key] : defaultValue),
    0,
  );
  return total / n;
}

/**
 * Rounds a number to one decimal place.
 */
function roundValue(val: number | null | undefined): number | null {
  return val === undefined || val === null ? null : Math.round(val * 10) / 10;
}

/**
 * Updates team positions, past positions, points, and earnings.
 */
async function updateTeamPositions(
  updatedTeams: TeamData[],
  tournament: TournamentData,
): Promise<TeamData[]> {
  return Promise.all(
    updatedTeams.map(async (team) => {
      const sameTourTeams = updatedTeams.filter(
        (obj) => obj.tourCard.tourId === team.tourCard.tourId,
      );
      // Determine current position
      const tiedCount = sameTourTeams.filter(
        (obj) => (obj.score ?? 100) === (team.score ?? 100),
      ).length;
      const lowerScoreCount = sameTourTeams.filter(
        (obj) => (obj.score ?? 100) < (team.score ?? 100),
      ).length;
      team.position = `${tiedCount > 1 ? "T" : ""}${lowerScoreCount + 1}`;

      // Determine past position based on (score - today)
      const tiedPastCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) - (obj.today ?? 100) ===
          (team.score ?? 100) - (team.today ?? 100),
      ).length;
      const lowerPastCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) - (obj.today ?? 100) <
          (team.score ?? 100) - (team.today ?? 100),
      ).length;
      team.pastPosition = `${tiedPastCount > 1 ? "T" : ""}${lowerPastCount + 1}`;

      // Update points and earnings if tournament round 4 is complete and not live.
      if (
        !tournament.livePlay &&
        tournament.currentRound === 4 &&
        (team.thru ?? 0) > 0
      ) {
        if (team.position.includes("T")) {
          const tiedTeams = updatedTeams.filter(
            (obj) => obj.position === team.position,
          );
          team.points =
            tournament.tier.points
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") - 1 + tiedTeams.length,
              )
              .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
          team.earnings =
            tournament.tier.payouts
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") - 1 + tiedTeams.length,
              )
              .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
        } else {
          team.points = tournament.tier.points[+team.position - 1] ?? null;
          team.earnings = tournament.tier.payouts[+team.position - 1] ?? null;
        }
      }

      await api.team.update(team);
      return team;
    }),
  );
}
