"use client";

import {
  cn,
  formatScore,
  getGolferTeeTime,
  getTeamTeeTime,
} from "@/src/lib/utils";
import type { TeamData, TournamentData } from "@/src/types/prisma_include";
import type { Golfer, Member } from "@prisma/client";
import { useState } from "react";
import { Table, TableRow } from "../../_components/ui/table";

export function PGCListing({
  tournament,
  team,
  golfers,
  member,
}: {
  tournament: TournamentData;
  team: TeamData;
  golfers: Golfer[] | undefined;
  member: Member;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className={cn(
        "grid grid-flow-row grid-cols-10 border-b border-slate-300 py-1 text-center",
      )}
      key={team.id}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="col-span-2 place-self-center font-varela text-base">
        {team.position}
      </div>
      <div className="col-span-4 place-self-center font-varela text-lg">
        {team.tourCard.displayName}
      </div>
      <div className="col-span-2 place-self-center font-varela text-base">
        {formatScore(team.score)}
      </div>
      {team.thru === 0 ? (
        <div className="col-span-2 place-self-center font-varela text-sm">
          {getTeamTeeTime(team)}
        </div>
      ) : (
        <>
          <div className="col-span-1 place-self-center font-varela text-sm">
            {formatScore(team.today)}
          </div>
          <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
            {team.thru === 18 ? "F" : team.thru}
          </div>
        </>
      )}
      {isOpen && (
        <>
          <div className="col-span-10 mt-2 grid grid-cols-12 items-center justify-center">
            <div className="col-span-7 text-sm font-bold">Rounds</div>
            {(team.round ?? 0 <= 2) ? (
              <>
                <div className="col-span-3 text-sm font-bold">Make Cut</div>
                <div className="col-span-2 text-sm font-bold">Top Ten</div>
              </>
            ) : (
              <>
                <div className="col-span-3 text-sm font-bold">Top Ten</div>
                <div className="col-span-2 text-sm font-bold">Win</div>
              </>
            )}
            <div className="col-span-7 text-lg">
              {team.roundOne ?? "-"}
              {team.roundTwo ? " / " + team.roundTwo : ""}
              {team.roundThree ? " / " + team.roundThree : ""}
              {team.roundFour ? " / " + team.roundFour : ""}
            </div>
            {(team.round ?? 0 <= 2) ? (
              <>
                <div className="col-span-3 text-lg">
                  {Math.round((team.makeCut ?? 0) * 1000) / 10}%
                </div>
                <div className="col-span-2 text-lg">
                  {Math.round((team.makeCut ?? 0) * 1000) / 10}%
                </div>
              </>
            ) : (
              <>
                <div className="col-span-3 text-lg">
                  {Math.round((team.makeCut ?? 0) * 1000) / 10}%
                </div>
                <div className="col-span-2 text-lg">
                  {Math.round((team.makeCut ?? 0) * 1000) / 10}%
                </div>
              </>
            )}
          </div>
          <div className="col-span-10 mx-auto my-4 w-11/12">
            <Table className="scrollbar-hidden mx-auto w-full border border-gray-700 text-center font-varela">
              <TableRow className="bg-gray-700 font-bold text-gray-100 hover:bg-gray-700">
                <td className="text-sm">Pos</td>
                <td className="text-sm">Player</td>
                <td className="text-sm">Score</td>
                <td className="text-xs">Today</td>
                <td className="text-xs">Thru</td>
                <td className="text-xs">Group</td>
              </TableRow>
              {golfers
                ?.filter((g) => team.golferIds.includes(g.apiId))
                .sort((a, b) => {
                  const key = tournament.livePlay ? "today" : "score";
                  return (
                    (a[key] ?? 100) - (b[key] ?? 100) ||
                    (a.thru === 0 && b.thru === 0
                      ? (a.score ?? 100) - (b.score ?? 100)
                      : 0)
                  );
                })
                .map((golfer, i) => (
                  <TableRow
                    key={golfer.id}
                    className={cn(
                      (team.round ?? 0) >= 3 && i === 4
                        ? "border-b border-gray-700"
                        : "",
                      i === 9 && "border-b border-gray-700",
                    )}
                  >
                    <td className="text-sm">{golfer.position}</td>
                    <td className="whitespace-nowrap px-1.5 text-sm">
                      {golfer.playerName}
                    </td>
                    <td className="text-sm">{formatScore(golfer.score)}</td>
                    {golfer.thru === 0 ? (
                      <td className="text-xs" colSpan={2}>
                        {getGolferTeeTime(golfer)}
                      </td>
                    ) : (
                      <>
                        <td className="text-xs">{formatScore(golfer.today)}</td>
                        <td className="text-xs">
                          {golfer.thru === 18 ? "F" : golfer.thru}
                        </td>
                      </>
                    )}
                    <td className="text-xs">{golfer.group}</td>
                  </TableRow>
                ))}
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

// function simulateTournament(
//   teams: TeamData[],
//   teamGolfers: Golfer[],
//   numSimulations = 10000,
// ) {
//   let results = teams.map((team) => ({
//     teamID: team.id,
//     wins: 0,
//     top3: 0,
//     top5: 0,
//     top10: 0,
//   }));

//   function getProjectedScore(golfer: Golfer) {
//     // Base score expectation centered around talent rating (lower is better)
//     let talentFactor = (golfer.rating ?? 0 - 50) / 10; // Normalize around 50
//     let baseScore = -1.5 - talentFactor; // Good golfers shoot lower scores

//     // Adjust for partial round
//     if (golfer.thru ?? 0 < 18) {
//       let remainingHoles = 18 - (golfer.thru ?? 0);
//       let avgHoleScore = baseScore / 18 + (Math.random() - 0.5) * 0.1;
//       return (golfer.score ?? 0) + remainingHoles * avgHoleScore;
//     }

//     return golfer.score;
//   }

//   for (let sim = 0; sim < numSimulations; sim++) {
//     let finalScores = teams.map((team) => {
//       let remainingGolfers = teamGolfers
//         .filter((g) => !["CUT", "WD", "DQ"].includes(g.position ?? ""))
//         .map((golfer) => ({
//           ...golfer,
//           projectedScore: getProjectedScore(golfer),
//         }));

//       if (remainingGolfers.length < 5) return { team, finalScore: Infinity }; // Team is cut

//       // Simulate Rounds 3 & 4
//       let simulatedScores = remainingGolfers.map(
//         (golfer) => golfer.projectedScore ?? 0 + (Math.random() - 0.5) * 3,
//       );

//       // Use best 5 scores
//       simulatedScores.sort((a, b) => a - b);
//       let teamFinalScore =
//         simulatedScores.slice(0, 5).reduce((sum, score) => sum + score, 0) / 5;

//       return { team, finalScore: teamFinalScore };
//     });

//     // Sort teams by best (lowest) final score
//     finalScores.sort((a, b) => a.finalScore - b.finalScore);

//     // Assign placements
//     const winningTeam =
//       finalScores[0] && finalScores[0].team
//         ? results.find((r) => r.teamID === finalScores[0]?.team?.id)
//         : undefined;
//     if (winningTeam) {
//       winningTeam.wins++;
//     }
//     finalScores.slice(0, 3).forEach(({ team }) => {
//       const result = results.find((r) => r.teamID === team.id);
//       if (result) result.top3++;
//     });
//     finalScores.slice(0, 5).forEach(({ team }) => {
//       const result = results.find((r) => r.teamID === team.id);
//       if (result) result.top5++;
//     });
//     finalScores.slice(0, 10).forEach(({ team }) => {
//       const result = results.find((r) => r.teamID === team.id);
//       if (result) result.top10++;
//     });
//   }

//   return results.map((r) => ({
//     teamID: r.teamID,
//     winPercentage: (r.wins / numSimulations).toFixed(2),
//     top3Percentage: (r.top3 / numSimulations).toFixed(2),
//     top5Percentage: (r.top5 / numSimulations).toFixed(2),
//     top10Percentage: (r.top10 / numSimulations).toFixed(2),
//   }));
// }
