"use server";

import { api } from "@/src/trpc/server";
import {
  Course,
  Golfer,
  Team,
  Tier,
  TourCard,
  Tournament,
} from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  const seasons = await api.season.getAll();
  const tiers = await api.tier.getAll();
  const courses = await api.course.getAll();
  seasons
    .filter((a) => a.number === 1)
    .map(async (season) => {
      const tourCards = (
        await api.tourCard.getBySeason({
          seasonId: season.id,
        })
      ).map(async (tc) => {
        const teams = await api.team.getByTourCard({
          tourCardId: tc.id,
        });
        tc.earnings = teams.reduce((p, c) => (p += c.earnings ?? 0), 0);
        tc.points = teams.reduce((p, c) => (p += c.points ?? 0), 0);
        tc.appearances = teams.length;
        tc.madeCut = teams.filter((a) => a.position !== "CUT").length;
        await api.tourCard.update({
          id: tc.id,
          earnings: tc.earnings,
          points: tc.points,
          appearances: tc.appearances,
          madeCut: tc.madeCut,
        });

        return tc;
      });
    });

  return NextResponse.redirect(`${origin}/`);
}
// http://localhost:3000/api/recalc/teams
// https://www.pgctour.ca/api/recalc/teams

function calculateRoundByRoundScoring({
  team,
  tourCards,
  playoffTier,
  playoffTournaments,
  tournament,
  multiplier,
  weekEndMultiplier,
  i,
}: {
  team: Team;
  tourCards: TourCard[];
  playoffTier: Tier | undefined;
  playoffTournaments: (Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course: Course | undefined;
  })[];
  tournament: Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course: Course | undefined;
  };
  multiplier: number;
  weekEndMultiplier: number;
  i: number;
}) {
  const tourCard = tourCards.find((a) => a.id === team.tourCardId);
  const teamFinishPos = tourCards.find(
    (a) => a.id === team.tourCardId,
  )?.position;
  const finishPoints = teamFinishPos?.includes("T")
    ? (playoffTier?.points ?? [])
        .slice(
          +teamFinishPos.replace("T", "") - 1,
          +teamFinishPos.replace("T", "") +
            tourCards.filter((a) => a.position === teamFinishPos).length -
            1,
        )
        .reduce((p, c) => p + c, 0) /
      tourCards.filter((a) => a.position === teamFinishPos).length
    : (playoffTier?.points ?? [])[+(teamFinishPos ?? 100) - 1];
  const startingStrokes =
    i === 0
      ? finishPoints
      : playoffTournaments[i - 1]?.teams.find(
          (a) => a.tourCardId === team.tourCardId,
        )?.score;
  const teamGolfers = tournament.golfers.filter((golfer) =>
    team.golferIds.includes(golfer.apiId),
  );
  team.roundOne =
    Math.round(
      [...teamGolfers.sort((a, b) => (a.roundOne ?? 100) - (b.roundOne ?? 100))]
        .slice(0, i === 0 ? 10 : i === 1 ? 5 : 3)
        .reduce((p, c) => p + (c.roundOne ?? 0), 0) / multiplier,
    ) / 10;
  team.roundTwo =
    Math.round(
      [...teamGolfers.sort((a, b) => (a.roundTwo ?? 100) - (b.roundTwo ?? 100))]
        .slice(0, i === 0 ? 10 : i === 1 ? 5 : 3)
        .reduce((p, c) => p + (c.roundTwo ?? 0), 0) / multiplier,
    ) / 10;
  team.roundThree =
    Math.round(
      [
        ...teamGolfers.sort(
          (a, b) => (a.roundThree ?? 100) - (b.roundThree ?? 100),
        ),
      ]
        .slice(0, i === 0 ? 5 : i === 1 ? 5 : 3)
        .reduce((p, c) => p + (c.roundThree ?? 0), 0) / weekEndMultiplier,
    ) / 10;
  team.roundFour =
    Math.round(
      [
        ...teamGolfers.sort(
          (a, b) => (a.roundFour ?? 100) - (b.roundFour ?? 100),
        ),
      ]
        .slice(0, i === 0 ? 5 : i === 1 ? 5 : 3)
        .reduce((p, c) => p + (c.roundFour ?? 0), 0) / weekEndMultiplier,
    ) / 10;
  team.score =
    Math.round(
      ((startingStrokes ?? 0) +
        (team.roundOne +
          team.roundTwo +
          team.roundThree +
          team.roundFour -
          (tournament.course?.par ?? 72) * 4)) *
        10,
    ) / 10;
  api.team.update({
    id: team.id,
    roundOne: team.roundOne,
    roundTwo: team.roundTwo,
    roundThree: team.roundThree,
    roundFour: team.roundFour,
    score: team.score,
    round: 5,
    points: 0,
    thru: 18,
    today:
      Math.round((team.roundFour - (tournament.course?.par ?? 72)) * 10) / 10,
  });
  return team;
}

function calculatePositionsAndPoints({
  team,
  tourCards,
  playoffTier,
  playoffTournaments,
  tournament,
  multiplier,
  weekEndMultiplier,
  i,
}: {
  team: Team;
  tourCards: TourCard[];
  playoffTier: Tier | undefined;
  playoffTournaments: (Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course: Course | undefined;
  })[];
  tournament: Tournament & {
    teams: Team[];
    golfers: Golfer[];
    course: Course | undefined;
  };
  multiplier: number;
  weekEndMultiplier: number;
  i: number;
}) {
  const tourCard = tourCards.find((a) => a.id === team.tourCardId);
  const betterTeams = tournament.teams.filter(
    (a) =>
      (a.score ?? 100) < (team.score ?? 100) &&
      a.tourCardId !== team.tourCardId &&
      tourCards.find((b) => b.id === a.tourCardId)?.playoff ===
        tourCard?.playoff,
  );
  const tiedTeams = tournament.teams.filter(
    (a) =>
      (a.score ?? 100) === (team.score ?? 100) &&
      a.tourCardId !== team.tourCardId &&
      tourCards.find((b) => b.id === a.tourCardId)?.playoff ===
        tourCard?.playoff,
  );
  const betterTeamsPast = tournament.teams.filter(
    (a) =>
      (a.score ?? 100) -
        ((a.roundFour ?? 100) - (tournament.course?.par ?? 72)) <
        (team.score ?? 100) -
          ((team.roundFour ?? 100) - (tournament.course?.par ?? 72)) &&
      a.tourCardId !== team.tourCardId &&
      tourCards.find((b) => b.id === a.tourCardId)?.playoff ===
        tourCard?.playoff,
  );
  const tiedTeamsPast = tournament.teams.filter(
    (a) =>
      (a.score ?? 100) -
        ((a.roundFour ?? 100) - (tournament.course?.par ?? 72)) ===
        (team.score ?? 100) -
          ((team.roundFour ?? 100) - (tournament.course?.par ?? 72)) &&
      a.tourCardId !== team.tourCardId &&
      tourCards.find((b) => b.id === a.tourCardId)?.playoff ===
        tourCard?.playoff,
  );
  team.position = `${tiedTeams.length > 0 ? "T" : ""}${betterTeams.length + 1}`;
  team.pastPosition = `${tiedTeamsPast.length > 0 ? "T" : ""}${betterTeamsPast.length + 1}`;
  team.earnings = 0;
  const earningsArray = playoffTier?.payouts.slice(
    tourCard?.playoff === 1 ? 0 : 75,
  );
  if (i === 2) {
    team.earnings =
      tiedTeams.length > 0
        ? (earningsArray
            ?.slice(
              betterTeams.length,
              betterTeams.length + tiedTeams.length + 1,
            )
            .reduce((p, c) => (p += +c), 0) ?? 0) /
          (tiedTeams.length + 1)
        : (earningsArray?.[+betterTeams.length] ?? 0);
  }
  api.team.update({
    id: team.id,
    position: team.position,
    pastPosition: team.pastPosition,
    earnings: team.earnings,
  });
}
