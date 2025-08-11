import { LeaderboardHeader, CreateTeamForm } from "@pgc-components";
import {
  getGolfersByTournament,
  getTeamByTournamentAndUser,
  getCurrentTourCard,
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

  // Get the specific tournament by ID instead of using getNextTournament
  const tournament = allTournaments.find((t) => t.id === params.tournamentId);

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

  // Check if this is a playoff tournament and get all playoff tournaments
  const isPlayoffTournament =
    tournament.tier?.name?.toLowerCase().includes("playoff") ?? false;
  let playoffTournamentIds: string[] = [];

  if (isPlayoffTournament) {
    const playoffTournaments = allTournaments.filter((t) =>
      t.tier?.name?.toLowerCase().includes("playoff"),
    );

    // Sort by start date to determine if this is the first playoff tournament
    playoffTournaments.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    // Allow team creation for first playoff tournament, or if existing team has empty golferIds
    const isFirstPlayoffTournament =
      playoffTournaments.length > 0 &&
      playoffTournaments[0]?.id === params.tournamentId;
    const hasEmptyTeam = existingTeam && existingTeam.golferIds.length === 0;

    if (isFirstPlayoffTournament || hasEmptyTeam) {
      playoffTournamentIds = playoffTournaments.map((t) => t.id);
    }
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
          playoffTournamentIds, // Pass the playoff tournament IDs
        }}
      />
    </div>
  );
}
