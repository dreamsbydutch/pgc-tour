import type { Golfer } from "@prisma/client";
import { cn } from "@pgc-utils";

export interface TeamGolfersListProps {
  golfers: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
}

export function TeamGolfersList({ golfers }: TeamGolfersListProps) {
  const sortedGolfers = golfers
    .sort((a, b) => (a.worldRank ?? Infinity) - (b.worldRank ?? Infinity))
    .sort((a, b) => (a.group ?? Infinity) - (b.group ?? Infinity));

  return (
    <div className="mt-2">
      {sortedGolfers.map((golfer, i) => (
        <div
          key={golfer.id}
          className={cn(
            i % 2 !== 0 && i < 9 && "border-b border-slate-500",
            i === 0 && "mt-2",
            "py-0.5",
          )}
        >
          <div className="text-lg">
            {`#${golfer.worldRank} ${golfer.playerName} (${golfer.rating})`}
          </div>
        </div>
      ))}
    </div>
  );
}
