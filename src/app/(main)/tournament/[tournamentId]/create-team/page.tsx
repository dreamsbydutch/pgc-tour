import { LeaderboardHeader, CreateTeamForm } from "@pgc-components";
import {
  getGolfersByTournament,
  getTeamByTournamentAndUser,
  getCurrentTourCard,
  getNextTournament,
  getSeasonTournament,
} from "@pgc-serverActions";
import type { Golfer, Team } from "@prisma/client";

// (should match your explicit form field types)
type GolferFormFields = Pick<
  Golfer,
  "apiId" | "playerName" | "worldRank" | "rating" | "group"
>;

function groupGolfers(
  golfers: GolferFormFields[],
): { key: string; golfers: GolferFormFields[] }[] {
  return [1, 2, 3, 4, 5].map((groupNum) => ({
    key: `group${groupNum}`,
    golfers: golfers
      .filter((golfer) => golfer.group === groupNum)
      .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
  }));
}
function getInitialGroups(existingTeam: Team | null): { golfers: number[] }[] {
  if (!existingTeam) {
    return Array.from({ length: 5 }, () => ({ golfers: [] as number[] }));
  }
  const result: { golfers: number[] }[] = Array.from({ length: 5 }, () => ({
    golfers: [] as number[],
  }));
  existingTeam.golferIds.forEach((golferId: number, index: number) => {
    const groupIndex = Math.floor(index / 2);
    if (groupIndex < 5) {
      result[groupIndex]?.golfers.push(golferId);
    }
  });
  return result;
}

export default async function CreateTeamPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const tourCard = await getCurrentTourCard();
  const allTournaments = await getSeasonTournament(tourCard?.seasonId ?? "");
  const tournament = await getNextTournament();

  // Ensure both tourCard and tournament are defined before proceeding
  if (!tourCard || !tournament) {
    return (
      <div className="text-red-500">Tournament or Tour Card not found.</div>
    );
  }

  const existingTeam = await getTeamByTournamentAndUser(
    tournament.id,
    tourCard.id,
  );

  if (tournament.id !== params.tournamentId) {
    return (
      <div className="text-red-500">
        Tournament not found - {params.tournamentId}
      </div>
    );
  }

  const golfers = await getGolfersByTournament(params.tournamentId);

  // Prepare golfers data (no need for useMemo unless data is huge)
  const golfersData: GolferFormFields[] = golfers.map((g) => ({
    apiId: g.apiId,
    playerName: g.playerName,
    worldRank: g.worldRank,
    rating: g.rating,
    group: g.group,
  }));

  const groups = groupGolfers(golfersData);
  const initialGroups = getInitialGroups(existingTeam);

  // This part must be rendered client-side for navigation
  // So we wrap the button in a Client Component
  function BackButton() {
    return (
      <a
        type="button"
        className="h-[2rem]"
        href={`/tournament/${params.tournamentId}`}
      >
        ← Back to Tournament
      </a>
    );
  }

  if (!tourCard) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 font-varela">
      {/* Back button to parent tournament page */}
      <LeaderboardHeader
        focusTourney={tournament}
        inputTournaments={allTournaments}
      />
      <BackButton />
      <CreateTeamForm
        {...{
          tournament,
          tourCard,
          existingTeam: existingTeam ?? null,
          groups,
          initialGroups,
        }}
      />
    </div>
  );
}
