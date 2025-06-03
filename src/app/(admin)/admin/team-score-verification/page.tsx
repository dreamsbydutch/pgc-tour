"use client";

import { api } from "@/src/trpc/react";

interface Member {
  id: string;
  fullname: string;
}

interface TourCard {
  id: string;
  memberId: string;
  seasonId: string;
  points: number;
  playoff: number;
  member?: Member;
}

interface Team {
  id: string;
  tourCardId: string;
  tournamentId: string;
  tourCard?: TourCard;
  startingStrokes?: number;
}

interface Tier {
  id: string;
  name: string;
  seasonId: string;
  points: number[];
}

interface Tournament {
  id: string;
  name: string;
  seasonId: string;
  tierId: string;
  startDate: string;
}

interface ProcessedTournament extends Tournament {
  goldTeams: Team[];
  silverTeams: Team[];
}

function calculateStartingStrokes(
  team: Team,
  allTeams: Team[],
  tier: Tier | undefined,
): number {
  if (!team.tourCard || !tier) return 0;

  const tiedTeams = allTeams.filter(
    (t) => t.tourCard?.points === team.tourCard?.points,
  );
  const betterTeams = allTeams.filter(
    (t) => (t.tourCard?.points ?? 0) > (team.tourCard?.points ?? 0),
  );

  if (tiedTeams.length > 1) {
    const pointsSlice = tier.points.slice(
      betterTeams.length,
      betterTeams.length + tiedTeams.length,
    );
    const averagePoints =
      pointsSlice.reduce((sum, points) => sum + points, 0) / tiedTeams.length;
    return Math.round(averagePoints * 10) / 10;
  }

  return tier.points[betterTeams.length] ?? 0;
}

function processTeamsForPlayoff(
  teams: Team[],
  tournamentId: string,
  playoffLevel: number,
  tier: Tier | undefined,
): Team[] {
  const filteredTeams = teams.filter(
    (team) =>
      team.tournamentId === tournamentId &&
      team.tourCard?.playoff === playoffLevel,
  );

  return filteredTeams.map((team) => ({
    ...team,
    startingStrokes: calculateStartingStrokes(team, filteredTeams, tier),
  }));
}

export default function TeamScoreVerificationPage() {
  const { data: season } = api.season.getByYear.useQuery({ year: 2024 });
  const { data: allTiers } = api.tier.getAll.useQuery();
  const { data: allMembers } = api.member.getAll.useQuery();
  const { data: allTourCards } = api.tourCard.getAll.useQuery();
  const { data: allTeams } = api.team.getAll.useQuery();
  const { data: allTournaments } = api.tournament.getAll.useQuery();

  if (
    !season ||
    !allTiers ||
    !allMembers ||
    !allTourCards ||
    !allTeams ||
    !allTournaments
  ) {
    return <div>Loading...</div>;
  }

  const tiers = allTiers.filter((tier) => tier.seasonId === season.id);

  const tourCards: TourCard[] = allTourCards
    .filter((tc) => tc.seasonId === season.id)
    .map((tc) => ({
      ...tc,
      member: allMembers.find((m) => m.id === tc.memberId),
    }));

  const teams: Team[] = allTeams.map((team) => ({
    ...team,
    id: String(team.id),
    tourCard: tourCards.find((tc) => tc.id === team.tourCardId),
  }));

  const playoffTournaments = allTournaments
    .filter((tournament) => {
      const tier = tiers.find((t) => t.id === tournament.tierId);
      return tournament.seasonId === season.id && tier?.name === "Playoff";
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  // Only process the first tournament
  const firstTournament = playoffTournaments[0];
  if (!firstTournament) {
    return <div>No playoff tournaments found for this season.</div>;
  }

  const tier = tiers.find((t) => t.id === firstTournament.tierId);

  const processedTournament: ProcessedTournament = {
    ...firstTournament,
    startDate:
      typeof firstTournament.startDate === "string"
        ? firstTournament.startDate
        : firstTournament.startDate.toISOString(),
    goldTeams: processTeamsForPlayoff(teams, firstTournament.id, 1, tier),
    silverTeams: processTeamsForPlayoff(teams, firstTournament.id, 2, tier),
  };

  return (
    <div className="flex flex-col">
      <div key={processedTournament.id} className="mb-6">
        <h2 className="mb-4 text-xl font-bold">{processedTournament.name}</h2>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border-b border-gray-200 p-2 text-left">Member</th>
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
            {[
              ...processedTournament.goldTeams,
              ...processedTournament.silverTeams,
            ]
              .sort((a, b) => {
                // Sort by playoff level first (Gold before Silver), then by points
                if (a.tourCard?.playoff !== b.tourCard?.playoff) {
                  return (
                    (a.tourCard?.playoff ?? 0) - (b.tourCard?.playoff ?? 0)
                  );
                }
                return (b.tourCard?.points ?? 0) - (a.tourCard?.points ?? 0);
              })
              .map((team) => (
                <tr key={team.id}>
                  <td className="border-b border-gray-200 p-2">
                    {team.tourCard?.member?.fullname || "Unknown Member"}
                  </td>
                  <td className="border-b border-gray-200 p-2 text-center">
                    {team.tourCard?.playoff === 1 ? "Gold" : "Silver"}
                  </td>
                  <td className="border-b border-gray-200 p-2 text-center">
                    {team.tourCard?.points ?? 0}
                  </td>
                  <td className="border-b border-gray-200 p-2 text-center">
                    {team.startingStrokes ?? 0}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
