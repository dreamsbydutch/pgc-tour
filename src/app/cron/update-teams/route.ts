"use server";

import { simulateTournament } from "@/src/lib/simulator";
import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import type {
  DatagolfFieldInput,
  DataGolfLiveTournament,
} from "@/src/types/datagolf_types";
import type { Golfer, Team } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
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
  golfers.sort(
    (a, b) =>
      (a.today ?? 0) - (b.today ?? 0) || // Sort by today
      (a.thru ?? 0) - (b.thru ?? 0) || // Then sort by thru
      (a.score ?? 0) - (b.score ?? 0) || // Then sort by score
      (a.group ?? 0) - (b.group ?? 0),
  );
  const teams = await api.team.getByTournament({ tournamentId: tournament.id });

  let updatedTeams = teams.map((team) => {
    const data: Team = { ...team, round: liveData.info.current_round };
    const teamGolfers = golfers.filter((golfer) =>
      team.golferIds.includes(golfer.apiId),
    );

    if (team.roundOneTeeTime === null) {
      data.roundOneTeeTime =
        teamGolfers.sort((a, b) => {
          if (!a.roundOneTeeTime && !b.roundOneTeeTime) return 0;
          if (!a.roundOneTeeTime) return 1;
          if (!b.roundOneTeeTime) return -1;
          return (
            new Date(a.roundOneTeeTime).getTime() -
            new Date(b.roundOneTeeTime).getTime()
          );
        })[0]?.roundOneTeeTime ?? "";
    }
    if (team.roundTwoTeeTime === null) {
      data.roundTwoTeeTime =
        teamGolfers.sort((a, b) => {
          if (!a.roundTwoTeeTime && !b.roundTwoTeeTime) return 0;
          if (!a.roundTwoTeeTime) return 1;
          if (!b.roundTwoTeeTime) return -1;
          return (
            new Date(a.roundTwoTeeTime).getTime() -
            new Date(b.roundTwoTeeTime).getTime()
          );
        })[0]?.roundTwoTeeTime ?? "";
    }
    if (team.roundThreeTeeTime === null) {
      data.roundThreeTeeTime =
        teamGolfers.sort((a, b) => {
          if (!a.roundThreeTeeTime && !b.roundThreeTeeTime) return 0;
          if (!a.roundThreeTeeTime) return 1;
          if (!b.roundThreeTeeTime) return -1;
          return (
            new Date(a.roundThreeTeeTime).getTime() -
            new Date(b.roundThreeTeeTime).getTime()
          );
        })[5]?.roundThreeTeeTime ?? "";
    }
    if (team.roundFourTeeTime === null) {
      data.roundFourTeeTime =
        teamGolfers.sort((a, b) => {
          if (!a.roundFourTeeTime && !b.roundFourTeeTime) return 0;
          if (!a.roundFourTeeTime) return 1;
          if (!b.roundFourTeeTime) return -1;
          return (
            new Date(a.roundFourTeeTime).getTime() -
            new Date(b.roundFourTeeTime).getTime()
          );
        })[5]?.roundFourTeeTime ?? "";
    }

    if (tournament.livePlay) {
      if ((tournament.currentRound ?? 0) >= 3) {
        data.today =
          teamGolfers.slice(0, 5).reduce((p, c) => (p += c.today ?? 8), 0) / 5;
        data.thru =
          teamGolfers.slice(0, 5).reduce((p, c) => (p += c.thru ?? 0), 0) / 5;
        if ((tournament.currentRound ?? 0) === 3) {
          data.score =
            (team.roundOne ?? 0) -
            tournament.course.par +
            ((team.roundTwo ?? 0) - tournament.course.par) +
            data.today;
        } else if ((tournament.currentRound ?? 0) === 4) {
          data.score =
            (team.roundOne ?? 0) -
            tournament.course.par +
            ((team.roundTwo ?? 0) - tournament.course.par) +
            ((team.roundThree ?? 0) - tournament.course.par) +
            data.today;
        }
      } else {
        data.today = teamGolfers.reduce((p, c) => (p += c.today ?? 8), 0) / 10;
        data.thru = teamGolfers.reduce((p, c) => (p += c.thru ?? 0), 0) / 10;
        if ((tournament.currentRound ?? 0) === 1) {
          data.score = data.today;
        } else if ((tournament.currentRound ?? 0) === 2) {
          data.score =
            (team.roundOne ?? 0) - tournament.course.par + data.today;
        }
      }
    } else {
      if ((tournament.currentRound ?? 0) === 1 && (team.thru ?? 0) > 0) {
        data.roundOne =
          teamGolfers.reduce(
            (p, c) => (p += c.roundOne ?? tournament.course.par + 8),
            0,
          ) / 10;
        data.today =
          teamGolfers.reduce(
            (p, c) => (p += c.roundOne ?? tournament.course.par + 8),
            0,
          ) /
            10 -
          tournament.course.par;
        data.thru = 18;
        data.score =
          teamGolfers.reduce(
            (p, c) => (p += c.roundOne ?? tournament.course.par + 8),
            0,
          ) /
            10 -
          tournament.course.par;
      }
      if ((tournament.currentRound ?? 0) === 2 && (team.thru ?? 0) > 0) {
        data.roundTwo =
          teamGolfers.reduce(
            (p, c) => (p += c.roundTwo ?? tournament.course.par + 8),
            0,
          ) / 10;
        data.today =
          teamGolfers.reduce(
            (p, c) => (p += c.roundTwo ?? tournament.course.par + 8),
            0,
          ) /
            10 -
          tournament.course.par;
        data.thru = 18;
        data.score =
          (team.roundOne ?? 0) -
          tournament.course.par +
          (teamGolfers.reduce(
            (p, c) => (p += c.roundTwo ?? tournament.course.par + 8),
            0,
          ) /
            10 -
            tournament.course.par);
      }
      if ((tournament.currentRound ?? 0) === 3 && (team.thru ?? 0) > 0) {
        data.roundThree =
          teamGolfers
            .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundThree ?? tournament.course.par + 8),
              0,
            ) / 5;
        data.today =
          teamGolfers
            .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundThree ?? tournament.course.par + 8),
              0,
            ) /
            5 -
          tournament.course.par;
        data.thru = 18;
        data.score =
          (team.roundOne ?? 0) +
          (team.roundTwo ?? 0) -
          tournament.course.par * 2 +
          (teamGolfers
            .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundThree ?? tournament.course.par + 8),
              0,
            ) /
            5 -
            tournament.course.par);
      }
      if ((tournament.currentRound ?? 0) === 4 && (team.thru ?? 0) > 0) {
        data.roundFour =
          teamGolfers
            .sort((a, b) => (a.roundFour ?? 0) - (b.roundFour ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundFour ?? tournament.course.par + 8),
              0,
            ) / 5;
        data.today =
          teamGolfers
            .sort((a, b) => (a.roundFour ?? 0) - (b.roundFour ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundFour ?? tournament.course.par + 8),
              0,
            ) /
            5 -
          tournament.course.par;
        data.thru = 18;
        data.score =
          (team.roundOne ?? 0) +
          (team.roundTwo ?? 0) +
          (team.roundThree ?? 0) -
          tournament.course.par * 3 +
          (teamGolfers
            .sort((a, b) => (a.roundFour ?? 0) - (b.roundFour ?? 0))
            .slice(0, 5)
            .reduce(
              (p, c) => (p += c.roundFour ?? tournament.course.par + 8),
              0,
            ) /
            5 -
            tournament.course.par);
      }
    }

    if (data.score) {
      data.score = Math.round(data.score * 10) / 10;
    }
    if (data.today) {
      data.today = Math.round(data.today * 10) / 10;
    }
    if (data.thru) {
      data.thru = Math.round(data.thru * 10) / 10;
    }
    if (data.roundOne) {
      data.roundOne = Math.round(data.roundOne * 10) / 10;
    }
    if (data.roundTwo) {
      data.roundTwo = Math.round(data.roundTwo * 10) / 10;
    }
    if (data.roundThree) {
      data.roundThree = Math.round(data.roundThree * 10) / 10;
    }
    if (data.roundFour) {
      data.roundFour = Math.round(data.roundFour * 10) / 10;
    }

    return data;
  });

  updatedTeams = simulateTournament(
    golfers,
    updatedTeams,
    tournament.course.par,
    100000,
  );

  updatedTeams = await Promise.all(
    updatedTeams.map(async (team) => {
      team.position =
        "" +
        (updatedTeams.filter(
          (obj) => (obj.score ?? 100) === (team.score ?? 100),
        ).length > 1
          ? "T"
          : "") +
        (
          1 +
          updatedTeams.filter((obj) => (obj.score ?? 100) < (team.score ?? 100))
            .length
        ).toString();

      team.pastPosition =
        "" +
        (updatedTeams.filter(
          (obj) =>
            (obj.score ?? 100) - (obj.today ?? 100) ===
            (team.score ?? 100) - (team.today ?? 100),
        ).length > 1
          ? "T"
          : "") +
        (
          1 +
          updatedTeams.filter(
            (obj) =>
              (obj.score ?? 100) - (obj.today ?? 100) <
              (team.score ?? 100) - (team.today ?? 100),
          ).length
        ).toString();

      if (
        !tournament.livePlay &&
        (tournament.currentRound ?? 0) === 4 &&
        (team.thru ?? 0) > 0
      ) {
        team.points = team.position.includes("T")
          ? tournament.tier.points
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") -
                  1 +
                  updatedTeams.filter((obj) => obj.position === team.position)
                    .length,
              )
              .reduce((p, c) => (p += c), 0) /
            updatedTeams.filter((obj) => obj.position === team.position).length
          : (tournament.tier.points[+team.position - 1] ?? null);
        team.earnings = team.position.includes("T")
          ? tournament.tier.payouts
              .slice(
                +team.position.replace("T", "") - 1,
                +team.position.replace("T", "") -
                  1 +
                  updatedTeams.filter((obj) => obj.position === team.position)
                    .length,
              )
              .reduce((p, c) => (p += c), 0) /
            updatedTeams.filter((obj) => obj.position === team.position).length
          : (tournament.tier.payouts[+team.position - 1] ?? null);
      }

      await api.team.update(team);

      return team;
    }),
  );

  return NextResponse.redirect(`${origin}${next}`);
}
// http://www.pgctour.ca/cron/update-teams
// http://localhost:3000/cron/update-teams
