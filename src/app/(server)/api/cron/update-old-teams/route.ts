// "use server";

import { api } from "@/trpc/server";
import type { Team, TourCard, Tournament } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  const members = await api.member.getAll();
  const season = await api.season.getByYear({ year: 2025 });
  const tourCards = (await api.tourCard.getAll()).filter(
    (obj) => obj.seasonId === season?.id,
  );
  const allTeams = await api.team.getAll();
  const tournaments = (await api.tournament.getAll()).filter(
    (obj) =>
      obj.seasonId === season?.id && new Date(obj.startDate) < new Date(),
  );
  if (!tourCards || !tournaments || !allTeams || !members) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  await updateTourCards({
    tourCards,
    allTeams: allTeams
      .map((team) => {
        const tournament = tournaments.find((t) => t.id === team.tournamentId);
        if (!tournament) return null;
        // Only include the fields expected by the type
        const {
          name,
          id,
          apiId,
          createdAt,
          updatedAt,
          seasonId,
          startDate,
          endDate,
          tierId,
          courseId,
          logoUrl,
          currentRound,
          livePlay,
        } = tournament;
        return {
          ...team,
          tournament: {
            name,
            id,
            apiId,
            createdAt,
            updatedAt,
            seasonId,
            startDate,
            endDate,
            tierId,
            courseId,
            logoUrl,
            currentRound,
            livePlay,
          },
        };
      })
      .filter((team) => team !== null),
  });

  return NextResponse.redirect(`${origin}${next}`);
}

// http://localhost:3000/cron/update-old-teams

// type inputTeams = {
//   tourneyID: string;
//   Name: string;
//   golferOne: string;
//   golferTwo: string;
//   golferThree: string;
//   golferFour: string;
//   golferFive: string;
//   golferSix: string;
//   golferSeven: string;
//   golferEight: string;
//   golferNine: string;
//   golferTen: string;
// };

async function updateTourCards({
  tourCards,
  allTeams,
}: {
  tourCards: TourCard[];
  allTeams: (Team & { tournament: Tournament })[];
}) {
  await Promise.all(
    tourCards.map(async (card) => {
      const teams = allTeams.filter((team) => team.tourCardId === card.id);
      const earnings = teams.reduce((sum, team) => sum + (team.earnings ?? 0), 0);
      const points = teams.reduce((sum, team) => sum + (team.points ?? 0), 0);
      const win = teams.filter(
        (team) =>
          (team.position && team.position.startsWith("T")
            ? +(team.position?.replace("T", "") ?? 100)
            : +(team.position ?? 100)) === 1,
      ).length;
      const appearances = teams.length;
      const topTen = teams.filter(
        (team) =>
          (team.position && team.position.startsWith("T")
            ? +(team.position?.replace("T", "") ?? 100)
            : +(team.position ?? 100)) <= 10,
      ).length;
      const madeCut = teams.filter((team) => team.position !== "CUT").length;
      const ties = tourCards.filter((obj) => obj.points === card.points).length;
      const pos =
        tourCards.filter(
          (obj) => (obj.points ?? 0) > points && obj.tourId === card.tourId,
        ).length + 1;
      const position = (ties > 1 ? "T" : "") + pos;
      await api.tourCard.update({
        id: card.id,
        appearances,
        earnings,
        points,
        win,
        topTen,
        position,
        madeCut,
      });
      return card;
    }),
  );
  return;
}

// async function createTeam({
//   tournaments,
//   team,
// }: {
//   team: inputTeams;
//   tournaments: TournamentData[];
// }) {
//   const tourney = tournaments[+team.tourneyID - 1];
//   if (!tourney) {
//     console.log(`Tournament not found for team: ${team.tourneyID}`);
//     return;
//   }
//   const tourCard = await api.tourCard.getByDisplayName({
//     name: team.Name === "C. Haeberlin" ? "C. Grandma" : team.Name,
//     seasonId: "cm4w910w1000zdx9kq315wwv8",
//   });
//   if (!tourCard) {
//     console.log(`Tour card not found for ${team.Name}`);
//     return;
//   }
//   const teamExists = await api.team.getByUserTournament({
//     tourCardId: tourCard.id,
//     tournamentId: tourney.id,
//   });
//   if (teamExists) {
//     return;
//   }

//   const golfers = await api.golfer.getByTournament({
//     tournamentId: "cm4w91sbk0073dx9ki2pqq4v6",
//   });
//   const teamGolferNames = [
//     team.golferOne,
//     team.golferTwo,
//     team.golferThree,
//     team.golferFour,
//     team.golferFive,
//     team.golferSix,
//     team.golferSeven,
//     team.golferEight,
//     team.golferNine,
//     team.golferTen,
//   ];
//   const teamGolfers = teamGolferNames
//     .map((g) => golfers.find((x) => x.playerName === g)?.apiId)
//     .filter((x) => x !== undefined) as number[];

//   if (teamGolfers.length < 10) {
//     console.log(`Golfers not found for ${team.Name} - ${tourney.name}`);
//     return;
//   }
//   const teamData = {
//     tourCardId: tourCard.id,
//     golferIds: teamGolfers,
//     tournamentId: tourney.id,
//   };
//   await api.team.create(teamData);
//   console.log(`Team created for ${team.Name}`);
//   return teamData;
// }

// async function updateTournamentStats({ tourn }: { tourn: TournamentData }) {
//   const golfers = await api.golfer.getByTournament({
//     tournamentId: tourn.id,
//   });
//   const teams = await api.team.getByTournament({
//     tournamentId: tourn.id,
//   });
//   const updatedTeams = teams.map((team) => {
//     const updatedTeam: TeamData = {
//       ...team,
//       round: tourn.currentRound,
//     };
//     const teamGolfers = golfers.filter((g) => team.golferIds.includes(g.apiId));
//     // Assign tee times for each round if the current value is not in the future.
//     updatedTeam.roundOneTeeTime = assignTeeTime(
//       team.roundOneTeeTime,
//       teamGolfers,
//       "roundOneTeeTime",
//       0,
//     );
//     updatedTeam.roundTwoTeeTime = assignTeeTime(
//       team.roundTwoTeeTime,
//       teamGolfers,
//       "roundTwoTeeTime",
//       0,
//     );
//     updatedTeam.roundThreeTeeTime =
//       teamGolfers.filter((x) => (x.round ?? 0) >= 3).length >= 5
//         ? assignTeeTime(
//             team.roundThreeTeeTime,
//             teamGolfers.filter((x) => (x.round ?? 0) >= 3),
//             "roundThreeTeeTime",
//             teamGolfers.filter((x) => (x.round ?? 0) >= 3).length - 5,
//           )
//         : null;
//     updatedTeam.roundFourTeeTime =
//       teamGolfers.filter((x) => (x.round ?? 0) >= 3).length >= 5
//         ? assignTeeTime(
//             team.roundFourTeeTime,
//             teamGolfers.filter((x) => (x.round ?? 0) >= 3),
//             "roundFourTeeTime",
//             teamGolfers.filter((x) => (x.round ?? 0) >= 3).length - 5,
//           )
//         : null;
//     Object.assign(
//       updatedTeam,
//       calculateNonLiveTeamStats(updatedTeam, team, teamGolfers, tourn),
//     );

//     // Round numeric fields to one decimal place.
//     updatedTeam.score = roundValue(updatedTeam.score);
//     updatedTeam.today = roundValue(updatedTeam.today);
//     updatedTeam.thru = roundValue(updatedTeam.thru);
//     updatedTeam.roundOne = roundValue(updatedTeam.roundOne);
//     updatedTeam.roundTwo = roundValue(updatedTeam.roundTwo);
//     updatedTeam.roundThree = roundValue(updatedTeam.roundThree);
//     updatedTeam.roundFour = roundValue(updatedTeam.roundFour);

//     return updatedTeam;
//   });
//   await updateTeamPositions(updatedTeams, tourn, golfers);
//   return;
// }
// function assignTeeTime(
//   currentTeeTime: string | null | undefined,
//   teamGolfers: Golfer[],
//   teeTimeKey: keyof Golfer,
//   sortIndex: number,
// ): string {
//   const sorted = teamGolfers.slice().sort((a, b) => {
//     const aTime = a[teeTimeKey] ? new Date(a[teeTimeKey]).getTime() : Infinity;
//     const bTime = b[teeTimeKey] ? new Date(b[teeTimeKey]).getTime() : Infinity;
//     return aTime - bTime;
//   });
//   return sorted[sortIndex]?.[teeTimeKey]?.toString() ?? "";
// }
// function roundValue(val: number | null | undefined): number | null {
//   return val === undefined || val === null ? null : Math.round(val * 10) / 10;
// }
// function average(
//   arr: Record<string | number, number | string | Date | null | undefined>[],
//   key: string,
//   defaultValue: number,
//   count?: number,
// ): number {
//   const n = count ?? arr.length;
//   if (n === 0) return defaultValue;
//   const total = arr.reduce(
//     (sum, item) =>
//       sum + (typeof item[key] === "number" ? item[key] : defaultValue),
//     0,
//   );
//   return total / n;
// }
// function calculateNonLiveTeamStats(
//   updatedTeam: TeamData,
//   team: TeamData,
//   teamGolfers: Golfer[],
//   tournament: TournamentData,
// ): Partial<TeamData> {
//   updatedTeam.roundOne = average(
//     teamGolfers,
//     "roundOne",
//     tournament.course.par + 8,
//     teamGolfers.length,
//   );
//   updatedTeam.roundTwo = average(
//     teamGolfers,
//     "roundTwo",
//     tournament.course.par + 8,
//     teamGolfers.length,
//   );
//   if (teamGolfers.length >= 5) {
//     teamGolfers = teamGolfers.filter((g) => (g.round ?? 0) >= 3);
//     const sortedR3 = teamGolfers
//       .slice()
//       .sort((a, b) => (a.roundThree ?? 0) - (b.roundThree ?? 0));
//     updatedTeam.roundThree = average(
//       sortedR3.slice(0, 5),
//       "roundThree",
//       tournament.course.par + 8,
//       5,
//     );
//     const sortedR4 = teamGolfers
//       .slice()
//       .sort((a, b) => (a.roundFour ?? 0) - (b.roundFour ?? 0));
//     updatedTeam.roundFour = average(
//       sortedR4.slice(0, 5),
//       "roundFour",
//       tournament.course.par + 8,
//       5,
//     );
//     updatedTeam.today =
//       average(sortedR4.slice(0, 5), "roundFour", tournament.course.par + 8, 5) -
//       tournament.course.par;
//     updatedTeam.thru = 18;
//     updatedTeam.score =
//       (team.roundOne ?? 0) +
//       (team.roundTwo ?? 0) +
//       (team.roundThree ?? 0) +
//       (team.roundFour ?? 0) -
//       tournament.course.par * 4;
//   }
//   return updatedTeam;
// }

// async function updateTeamPositions(
//   updatedTeams: TeamData[],
//   tournament: TournamentData,
//   golfers: Golfer[],
// ): Promise<TeamData[]> {
//   return Promise.all(
//     updatedTeams.map(async (team) => {
//       const teamGolfers = golfers.filter(
//         (g) => team.golferIds.includes(g.apiId) && (g.round ?? 0) >= 3,
//       );

//       if (teamGolfers.length < 5) {
//         team.position = "CUT";
//         team.pastPosition = "CUT";
//         team.roundThree = null;
//         team.roundFour = null;
//         team.score = null;
//         team.today = null;
//         team.thru = null;
//         team.points = 0;
//         team.earnings = 0;
//         await api.team.update(team);
//         return team;
//       }
//       const sameTourTeams = updatedTeams.filter(
//         (obj) => obj.tourCard.tourId === team.tourCard.tourId,
//       );
//       // Determine current position
//       const tiedCount = sameTourTeams.filter(
//         (obj) =>
//           (obj.score ?? 100) === (team.score ?? 100) && obj.position !== "CUT",
//       ).length;
//       const lowerScoreCount = sameTourTeams.filter(
//         (obj) =>
//           (obj.score ?? 100) < (team.score ?? 100) && obj.position !== "CUT",
//       ).length;
//       team.position = `${tiedCount > 1 ? "T" : ""}${lowerScoreCount + 1}`;

//       // Determine past position based on (score - today)
//       const tiedPastCount = sameTourTeams.filter(
//         (obj) =>
//           (obj.score ?? 100) - (obj.today ?? 100) ===
//             (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
//       ).length;
//       const lowerPastCount = sameTourTeams.filter(
//         (obj) =>
//           (obj.score ?? 100) - (obj.today ?? 100) <
//             (team.score ?? 100) - (team.today ?? 100) && obj.position !== "CUT",
//       ).length;
//       team.pastPosition = `${tiedPastCount > 1 ? "T" : ""}${lowerPastCount + 1}`;

//       // Update points and earnings if tournament round 4 is complete and not live.
//       if (team.position.includes("T")) {
//         const tiedTeams = updatedTeams.filter(
//           (obj) =>
//             obj.position === team.position &&
//             obj.tourCard.tourId === team.tourCard.tourId,
//         );
//         team.points =
//           tournament.tier.points
//             .slice(
//               +team.position.replace("T", "") - 1,
//               +team.position.replace("T", "") - 1 + tiedTeams.length,
//             )
//             .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
//         team.earnings =
//           tournament.tier.payouts
//             .slice(
//               +team.position.replace("T", "") - 1,
//               +team.position.replace("T", "") - 1 + tiedTeams.length,
//             )
//             .reduce((p: number, c: number) => p + c, 0) / tiedTeams.length;
//       } else {
//         team.points = tournament.tier.points[+team.position - 1] ?? null;
//         team.earnings = tournament.tier.payouts[+team.position - 1] ?? null;
//       }
//       team.points = Math.round(team.points ?? 0);
//       team.earnings = Math.round((team.earnings ?? 0) * 100) / 100;
//       team.score = team.score ?? 0;

//       await api.team.update(team);
//       return team;
//     }),
//   );
// }
