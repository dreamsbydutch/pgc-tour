"use client";

import { api } from "@/trpc/react";

export default function TeamScoreVerificationPage() {
  const season = api.season.getByYear.useQuery({ year: 2024 }).data;
  const tiers = api.tier.getAll
    .useQuery()
    .data?.filter((tier) => tier.seasonId === season?.id);
  const members = api.member.getAll.useQuery();
  const tourCards =
    api.tourCard.getAll
      .useQuery()
      .data?.filter((tc) => tc.seasonId === season?.id)
      .map((tc) => {
        return {
          ...tc,
          member: members.data?.find((m) => m.id === tc.memberId),
        };
      }) ?? [];
  const teams =
    api.team.getAll
      .useQuery()
      .data?.map(
        (
          t: typeof api.team.getAll.useQuery extends () => { data: (infer U)[] }
            ? U
            : any,
        ) => {
          return {
            ...t,
            tourCard: tourCards?.find((tc) => tc.id === t.tourCardId),
          };
        },
      ) ?? [];
  const tournaments = api.tournament.getAll
    .useQuery()
    .data?.filter(
      (t) =>
        t.seasonId === season?.id &&
        tiers?.find((tier) => tier.id === t.tierId)?.name === "Playoff",
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .map((t, i) => {
      if (i !== 0) return;
      const tier = tiers?.find((tier) => tier.id === t.tierId);
      const tourneyGoldTeams = teams.filter(
        (team) => team.tournamentId === t.id && team.tourCard.playoff === 1,
      );
      const goldTeams = tourneyGoldTeams.map((team) => {
        const tiedTeams = tourneyGoldTeams.filter(
          (t2) => t2.tourCard.points === team.tourCard.points,
        );
        const betterTeams = tourneyGoldTeams.filter(
          (t2) => t2.tourCard.points > team.tourCard.points,
        );
        if (tiedTeams.length > 1) {
          team.startingStrokes =
            Math.round(
              ((tier?.points
                .slice(
                  betterTeams.length,
                  betterTeams.length + tiedTeams.length,
                )
                .reduce((p, c) => p + c, 0) ?? 0) /
                tiedTeams.length) *
                10,
            ) / 10;
        } else {
          team.startingStrokes = tier?.points[betterTeams.length] ?? 0;
        }
        return team;
      });
      const tourneySilverTeams = teams.filter(
        (team) => team.tournamentId === t.id && team.tourCard.playoff === 2,
      );
      const silverTeams = tourneySilverTeams.map((team) => {
        const tiedTeams = tourneySilverTeams.filter(
          (t2) => t2.tourCard.points === team.tourCard.points,
        );
        const betterTeams = tourneySilverTeams.filter(
          (t2) => t2.tourCard.points > team.tourCard.points,
        );
        if (tiedTeams.length > 1) {
          team.startingStrokes =
            Math.round(
              ((tier?.points
                .slice(
                  betterTeams.length,
                  betterTeams.length + tiedTeams.length,
                )
                .reduce((p, c) => p + c, 0) ?? 0) /
                tiedTeams.length) *
                10,
            ) / 10;
        } else {
          team.startingStrokes = tier?.points[betterTeams.length] ?? 0;
        }
        return team;
      });
      return {
        ...t,
        goldTeams: goldTeams,
        silverTeams: silverTeams,
      };
    })
    .filter((tournament) => tournament !== undefined);
  return (
    <div className="flex flex-col">
      {tournaments?.map((tournament) => (
        <div key={tournament.id} className="mb-6">
          <h2 className="mb-4 text-xl font-bold">{tournament.name}</h2>
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="border-b border-gray-200 p-2 text-left">
                  Member
                </th>
                <th className="border-b border-gray-200 p-2 text-center">
                  Playoff
                </th>
                <th className="border-b border-gray-200 p-2 text-center">
                  Points
                </th>
                <th className="border-b border-gray-200 p-2 text-center">
                  Strokes
                </th>
              </tr>
            </thead>
            <tbody>
              {tournament.goldTeams
                .sort((a, b) => b.tourCard.points - a.tourCard.points)
                .map((team) => (
                  <tr key={team.id}>
                    <td className="border-b border-gray-200 p-2">
                      {team.tourCard?.member?.fullname || "Unknown Member"}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.tourCard?.playoff === 1 ? "Gold" : "Silver"}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.tourCard.points}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.startingStrokes}
                    </td>
                  </tr>
                ))}
              {tournament.silverTeams
                .sort((a, b) => b.tourCard.points - a.tourCard.points)
                .map((team) => (
                  <tr key={team.id}>
                    <td className="border-b border-gray-200 p-2">
                      {team.tourCard?.member?.fullname || "Unknown Member"}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.tourCard?.playoff === 1 ? "Gold" : "Silver"}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.tourCard.points}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-center">
                      {team.startingStrokes}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
