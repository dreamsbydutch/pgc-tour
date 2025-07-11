/**
 * UI components for LeaderboardView
 */

import { cn } from "@/lib/utils/main";
import { MoveDownIcon, MoveHorizontalIcon, MoveUpIcon } from "lucide-react";

// ================= POSITION CHANGE =================

export const PositionChange: React.FC<{ posChange: number }> = ({
  posChange,
}) => {
  if (posChange === 0) {
    return (
      <span className="ml-1 flex items-center justify-center text-3xs">
        <MoveHorizontalIcon className="w-2" />
      </span>
    );
  }

  const isPositive = posChange > 0;
  const Icon = isPositive ? MoveUpIcon : MoveDownIcon;
  const colorClass = isPositive ? "text-green-900" : "text-red-900";

  return (
    <span
      className={cn(
        "ml-0.5 flex items-center justify-center text-2xs",
        colorClass,
      )}
    >
      <Icon className="w-2" />
      {Math.abs(posChange)}
    </span>
  );
};

// ================= COUNTRY FLAG =================

export const CountryFlagDisplay: React.FC<{
  country: string | null;
  position: string | null;
}> = ({ country, position }) => (
  <div className="col-span-2 row-span-2 flex items-center justify-center text-sm font-bold">
    <div
      className={cn("w-[55%] max-w-8", isPlayerCut(position) && "opacity-40")}
    >
      {getCountryFlag(country)}
    </div>
  </div>
);

// ================= GOLFER STATS =================

export const GolferStatsGrid: React.FC<{ golfer: Golfer }> = ({ golfer }) => (
  <>
    {/* Mobile layout */}
    <div className="col-span-6 text-sm font-bold sm:hidden">Rounds</div>
    <div className="col-span-2 text-sm font-bold sm:hidden">Usage</div>
    <div className="col-span-2 text-sm font-bold sm:hidden">Group</div>
    <div className="col-span-6 text-lg sm:hidden">{formatRounds(golfer)}</div>
    <div className="col-span-2 text-lg sm:hidden">
      {formatPercentageDisplay(golfer.usage)}
    </div>
    <div className="col-span-2 text-lg sm:hidden">
      {golfer.group === 0 ? "-" : golfer.group}
    </div>

    {/* Desktop layout */}
    <div className="col-span-3 text-sm font-bold sm:col-span-2">Make Cut</div>
    <div className="col-span-3 text-sm font-bold sm:col-span-2">Top Ten</div>
    <div className="col-span-2 text-sm font-bold">Win</div>
    <div className="col-span-2 text-sm font-bold">WGR</div>
    <div className="col-span-2 text-sm font-bold">Rating</div>
    <div className="col-span-2 hidden text-sm font-bold sm:grid">Usage</div>
    <div className="col-span-2 hidden text-sm font-bold sm:grid">Group</div>

    <div className="col-span-3 text-lg sm:col-span-2">
      {formatPercentageDisplay(golfer.makeCut)}
    </div>
    <div className="col-span-3 text-lg sm:col-span-2">
      {formatPercentageDisplay(golfer.topTen)}
    </div>
    <div className="col-span-2 text-lg">
      {formatPercentageDisplay(golfer.win)}
    </div>
    <div className="col-span-2 text-lg">
      {golfer.worldRank ? `#${golfer.worldRank}` : "-"}
    </div>
    <div className="col-span-2 text-lg">{golfer.rating ?? "-"}</div>
    <div className="col-span-2 hidden text-lg sm:grid">
      {formatPercentageDisplay(golfer.usage)}
    </div>
    <div className="col-span-2 hidden text-lg sm:grid">
      {golfer.group === 0 ? "-" : golfer.group}
    </div>
  </>
);

// ================= HEADER =================

export const LeaderboardHeaderRow: React.FC<{
  tournamentOver: boolean;
  activeTour: string;
}> = ({ tournamentOver, activeTour }) => (
  <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center sm:grid-cols-16">
    <div className="col-span-2 place-self-center font-varela text-sm font-bold sm:col-span-3">
      Rank
    </div>
    <div className="col-span-4 place-self-center font-varela text-base font-bold">
      Name
    </div>
    <div className="col-span-2 place-self-center font-varela text-sm font-bold">
      Score
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Group" : "Points") : "Today"}
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Rating" : "Earnings") : "Thru"}
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R1
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R2
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R3
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R4
    </div>
  </div>
);
