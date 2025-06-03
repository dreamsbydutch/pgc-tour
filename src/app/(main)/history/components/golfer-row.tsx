// filepath: c:\Users\choug\OneDrive\Documents\GitHub\pgc-tour\src\app\(main)\history\components\golfer-row.tsx
import { TableCell, TableRow } from "@/src/app/_components/ui/table";
import { cn } from "@/src/lib/utils";
import { Tournament } from "@prisma/client";

interface GolferData {
  playerName: string;
  tournamentId: string;
  group: number;
}

interface Golfer {
  name: string;
  apps: number;
  wins: number;
  top5s: number;
  top10s: number;
  cutsMade: number;
  avgUsage: number | null;
  groupCounts: Record<number, number>;
  lowGroup: number | null;
  highGroup: number | null;
  groupOne?: number | null;
  groupTwo?: number | null;
  groupThree?: number | null;
  groupFour?: number | null;
  groupFive?: number | null;
}

interface GolferRowProps {
  golfer: Golfer;
  golfersData: GolferData[];
  nextTournament: Tournament | null;
  currentTournament: Tournament | null;
  pastTournament: Tournament | null;
}

type GroupPropertyKey =
  | "groupOne"
  | "groupTwo"
  | "groupThree"
  | "groupFour"
  | "groupFive";

const GROUP_PROPERTY_NAMES: GroupPropertyKey[] = [
  "groupOne",
  "groupTwo",
  "groupThree",
  "groupFour",
  "groupFive",
];

function getGroupPercentage(golfer: Golfer, groupNum: number): number | null {
  const groupPropName = GROUP_PROPERTY_NAMES[groupNum - 1];
  const value = golfer[groupPropName as keyof Golfer];
  return typeof value === "number" ? value : null;
}

function formatPercentage(value: number | null): string {
  if (value === null || value <= 0) return "-";
  return `${Math.round(value * 10) / 10}%`;
}

function calculateCutPercentage(cutsMade: number, apps: number): string {
  if (apps === 0) return "0%";
  return `${Math.round((cutsMade / apps) * 1000) / 10}%`;
}

function findGolferInTournament(
  golfersData: GolferData[],
  golferName: string,
  tournamentId: string | undefined,
): GolferData | undefined {
  if (!tournamentId) return undefined;

  return golfersData.find(
    (g) => g.playerName === golferName && g.tournamentId === tournamentId,
  );
}

function getTournamentGolfers(
  golfersData: GolferData[],
  tournamentId: string | undefined,
): GolferData[] {
  if (!tournamentId) return [];
  return golfersData.filter((g) => g.tournamentId === tournamentId);
}

function determineGroupHighlight(
  golfer: Golfer,
  groupNum: number,
  golfersData: GolferData[],
  nextTournament: Tournament | null,
  currentTournament: Tournament | null,
  pastTournament: Tournament | null,
): boolean {
  const nextTournamentGolfers = getTournamentGolfers(
    golfersData,
    nextTournament?.id,
  );
  const currentTournamentGolfers = getTournamentGolfers(
    golfersData,
    currentTournament?.id,
  );
  const pastTournamentGolfers = getTournamentGolfers(
    golfersData,
    pastTournament?.id,
  );

  // Priority 1: Next tournament
  if (nextTournamentGolfers.length > 0) {
    const golferInNext = findGolferInTournament(
      golfersData,
      golfer.name,
      nextTournament?.id,
    );
    return golferInNext?.group === groupNum;
  }

  // Priority 2: Current tournament (if no next tournament)
  if (currentTournamentGolfers.length > 0) {
    const golferInCurrent = findGolferInTournament(
      golfersData,
      golfer.name,
      currentTournament?.id,
    );
    return golferInCurrent?.group === groupNum;
  }

  // Priority 3: Past tournament (if no next or current tournament)
  if (pastTournamentGolfers.length > 0) {
    const golferInPast = findGolferInTournament(
      golfersData,
      golfer.name,
      pastTournament?.id,
    );
    return golferInPast?.group === groupNum;
  }

  return false;
}

export function GolferRow({
  golfer,
  golfersData,
  nextTournament,
  currentTournament,
  pastTournament,
}: GolferRowProps) {
  return (
    <TableRow key={golfer.name}>
      <TableCell className="whitespace-nowrap border-b border-gray-200 p-1 text-center">
        {golfer.name}
      </TableCell>
      <TableCell className="border-b border-gray-200 p-1 text-center">
        {golfer.apps}
      </TableCell>
      <TableCell className="border-b border-gray-200 p-1 text-center">
        {golfer.wins}
      </TableCell>
      <TableCell className="border-b border-gray-200 p-1 text-center">
        {golfer.top5s}
      </TableCell>
      <TableCell className="border-b border-gray-200 p-1 text-center">
        {golfer.top10s}
      </TableCell>
      <TableCell className="flex flex-row items-center justify-center gap-1 border-b border-gray-200 p-1 text-center">
        {calculateCutPercentage(golfer.cutsMade, golfer.apps)}
      </TableCell>
      <TableCell className="border-b border-gray-200 p-1 text-center">
        {golfer.avgUsage?.toFixed(2) ?? "-"}
        <span className="ml-0.5 text-xs">%</span>
      </TableCell>
      {[1, 2, 3, 4, 5].map((groupNum) => {
        const groupPercentage = getGroupPercentage(golfer, groupNum);
        const isHighlighted = determineGroupHighlight(
          golfer,
          groupNum,
          golfersData,
          nextTournament,
          currentTournament,
          pastTournament,
        );

        return (
          <TableCell
            key={`group-${groupNum}`}
            className={cn(
              "border-b border-gray-200 p-1 text-center text-2xs",
              groupNum === 1 ? "border-l-2 border-l-gray-300" : "",
              isHighlighted ? "bg-slate-50 font-bold" : "",
            )}
          >
            {formatPercentage(groupPercentage)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
