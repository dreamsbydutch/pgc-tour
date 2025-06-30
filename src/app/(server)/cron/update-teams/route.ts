"use server";

import { api } from "@/src/trpc/server";
import type { Course, Golfer, Team, Tournament } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const tournament = (await api.tournament.getInfo()).current;
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

  const teams: Team[] = await api.team.getByTournament({
    tournamentId: tournament.id,
  });
  const updatedTeams = teams.map((team) =>
    updateTeamData(team, tournament, golfers),
  );

  // updatedTeams = simulateTournament(
  //   golfers,
  //   updatedTeams,
  //   tournament.course.par,
  //   10000,
  // );
  await updateTeamPositions(updatedTeams, tournament, golfers);

  return NextResponse.redirect(`${origin}${next}`);
}

// https://www.pgctour.ca/cron/update-teams
// http://localhost:3000/cron/update-teams

/*─────────────────────────────────────────────────────────────*
 *                   HELPER FUNCTIONS BELOW                    *
 *─────────────────────────────────────────────────────────────*/

/**
 * Updates a single team's data by assigning tee times and calculating stats.
 */
function updateTeamData(
  team: Team,
  tournament: Tournament & { course: Course },
  golfers: Golfer[],
): Team {
  const updatedTeam: Team = {
    ...team,
    round: tournament.currentRound,
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
  if (tournament.livePlay) {
    Object.assign(
      updatedTeam,
      calculateLiveTeamStats(
        updatedTeam,
        team,
        teamGolfers.filter(
          (g) => (g.round ?? 0) >= (tournament.currentRound ?? 0),
        ),
        tournament,
      ),
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
  updatedTeam: Team,
  team: Team,
  teamGolfers: Golfer[],
  tournament: Tournament & { course: Course },
): Partial<Team> {
  if (teamGolfers.length < 5) {
    updatedTeam.today = null;
    updatedTeam.thru = null;
    updatedTeam.score = null;
    return updatedTeam;
  }
  if ((tournament.currentRound ?? 0) >= 3) {
    teamGolfers = teamGolfers.sort((a, b) => (a.today ?? 0) - (b.today ?? 0));
    if (teamGolfers.length < 5) {
      updatedTeam.today = null;
      updatedTeam.thru = null;
      updatedTeam.roundThree = null;
      updatedTeam.roundFour = null;
      updatedTeam.score = null;
    } else {
      updatedTeam.today = average(teamGolfers.slice(0, 5), "today", 8);
      updatedTeam.thru = average(teamGolfers.slice(0, 5), "thru", 0);
      if (tournament.currentRound === 3) {
        updatedTeam.score =
          (team.roundOne ?? 0) -
          tournament.course.par +
          ((team.roundTwo ?? 0) - tournament.course.par) +
          (updatedTeam.today ?? 0);
        if (updatedTeam.roundTwo === null) {
          updatedTeam.roundTwo = average(
            teamGolfers,
            "roundTwo",
            tournament.course.par + 8,
            teamGolfers.length,
          );
        }
      } else if (tournament.currentRound === 4) {
        updatedTeam.score =
          (team.roundOne ?? 0) -
          tournament.course.par +
          ((team.roundTwo ?? 0) - tournament.course.par) +
          ((team.roundThree ?? 0) - tournament.course.par) +
          (updatedTeam.today ?? 0);
        if (updatedTeam.roundThree === null) {
          updatedTeam.roundThree = average(
            teamGolfers
              .slice()
              .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0))
              .slice(0, 5),
            "roundThree",
            tournament.course.par + 8,
            5,
          );
        }
      }
    }
  } else {
    updatedTeam.today = average(teamGolfers, "today", 8, teamGolfers.length);
    updatedTeam.thru = average(teamGolfers, "thru", 0, teamGolfers.length);
    if (tournament.currentRound === 1) {
      updatedTeam.score = updatedTeam.today;
    } else if (tournament.currentRound === 2) {
      updatedTeam.score =
        (team.roundOne ?? 0) - tournament.course.par + (updatedTeam.today ?? 0);
      if (updatedTeam.roundOne === null) {
        updatedTeam.roundOne = average(
          teamGolfers,
          "roundOne",
          tournament.course.par + 8,
          teamGolfers.length,
        );
      }
    }
  }
  return updatedTeam;
}

/**
 * Calculates statistics for teams when live play is not active.
 */
function calculateNonLiveTeamStats(
  updatedTeam: Team,
  team: Team,
  teamGolfers: Golfer[],
  tournament: Tournament & { course: Course },
): Partial<Team> {
  if ((tournament.currentRound ?? 0) > 1 && !tournament.livePlay) {
    teamGolfers = teamGolfers.filter((g) => (g.round ?? 0) >= 1);
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
  if ((tournament.currentRound ?? 0) > 2 && !tournament.livePlay) {
    teamGolfers = teamGolfers.filter((g) => (g.round ?? 0) >= 2);
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
  if (
    (tournament.currentRound ?? 0) > 3 &&
    !tournament.livePlay &&
    teamGolfers.length >= 5
  ) {
    teamGolfers = teamGolfers.filter((g) => (g.round ?? 0) >= 3);
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
  if (
    (tournament.currentRound ?? 0) > 4 &&
    !tournament.livePlay &&
    teamGolfers.length >= 5
  ) {
    teamGolfers = teamGolfers.filter((g) => (g.round ?? 0) >= 4);
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
  updatedTeams: Team[],
  tournament: Tournament & { course: Course },
  golfers: Golfer[],
): Promise<Team[]> {
  const tier = await api.tier.getById({
    tierID: tournament.tierId,
  });
  const tourCards = await api.tourCard.getBySeason({
    seasonId: tournament.seasonId,
  });

  return Promise.all(
    updatedTeams.map(async (team) => {
      const tourCard = tourCards.find((t) => t.id === team.tourCardId);
      const teamGolfers = golfers.filter(
        (g) =>
          team.golferIds.includes(g.apiId) &&
          (g.round ?? 0) >= (tournament.currentRound ?? 0),
      );

      if (teamGolfers.length < 5) {
        team.position = "CUT";
        team.pastPosition = "CUT";
        team.score = null;
        team.today = null;
        team.thru = null;
        team.points = 0;
        team.earnings = 0;
        await api.team.update(team);
        return team;
      }
      const sameTourTeams = updatedTeams.filter(
        (obj) =>
          tourCards.find((a) => a.id === obj.tourCardId)?.tourId ===
          tourCard?.tourId,
      );
      // Determine current position
      const tiedCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) === (team.score ?? 100) && obj.position !== "CUT",
      ).length;
      const lowerScoreCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) < (team.score ?? 100) && obj.position !== "CUT",
      ).length;
      team.position = `${tiedCount > 1 ? "T" : ""}${lowerScoreCount + 1}`;

      // Determine past position based on (score - today)
      const tiedPastCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) - (obj.today ?? 100) ===
            (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
      ).length;
      const lowerPastCount = sameTourTeams.filter(
        (obj) =>
          (obj.score ?? 100) - (obj.today ?? 100) <
            (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
      ).length;
      team.pastPosition = `${tiedPastCount > 1 ? "T" : ""}${lowerPastCount + 1}`;

      // Update points and earnings if tournament round 4 is complete and not live.
      if (!tournament.livePlay && tournament.currentRound === 5) {
        if (team.position.includes("T")) {
          const tiedTeams = updatedTeams.filter(
            (obj) => obj.position === team.position,
          );
          team.points =
            (tier?.points ?? [])
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") - 1 + tiedTeams.length,
              )
              .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
          team.earnings =
            (tier?.payouts ?? [])
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") - 1 + tiedTeams.length,
              )
              .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
        } else {
          team.points = tier?.points[+team.position - 1] ?? null;
          team.earnings = tier?.payouts[+team.position - 1] ?? null;
        }
        team.points = Math.round(team.points ?? 0);
        team.earnings = Math.round((team.earnings ?? 0) * 100) / 100;
      }

      await api.team.update(team);
      return team;
    }),
  );
}
