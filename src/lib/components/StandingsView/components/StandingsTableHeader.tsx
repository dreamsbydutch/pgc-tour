import { cn } from "@pgc-utils";
import type { Tier } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/lib/components/functional/ui";
import { PointsAndPayoutsPopover } from "./PointsAndPayoutsPopover";

// --- Utility Components ---
const TableHeaderCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("place-self-center font-varela", className)}>
    {children}
  </div>
);

// --- Table Headers ---
function RegularStandingsHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 text-center">
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <TableHeaderCell className="text-xs font-bold sm:text-sm">
          Rank
        </TableHeaderCell>
        <TableHeaderCell className="col-span-5 text-base font-bold sm:text-lg">
          Name
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-2xs xs:text-xs sm:text-sm">
          Earnings
        </TableHeaderCell>
      </div>
    </div>
  );
}
function BumpedHeader() {
  return (
    <div className="mt-12 grid grid-flow-row grid-cols-17 rounded-xl bg-gradient-to-b from-red-200 text-center text-red-900">
      <div
        className={cn("col-span-17 my-2 font-varela text-2xl font-extrabold")}
      >
        KNOCKED OUT
      </div>
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <TableHeaderCell className="text-xs font-bold sm:text-sm">
          Rank
        </TableHeaderCell>
        <TableHeaderCell className="col-span-5 text-base font-bold sm:text-lg">
          Name
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </TableHeaderCell>
        <TableHeaderCell className="col-span-2 text-2xs xs:text-xs sm:text-sm">
          Earnings
        </TableHeaderCell>
      </div>
    </div>
  );
}
const PlayoffHeader = ({
  title,
  tier,
  className = "",
}: {
  title: string;
  tier: Tier;
  className?: string;
}) => (
  <Popover>
    <PopoverTrigger
      className={cn(
        "col-span-7 row-span-1 w-full text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg",
        className,
      )}
    >
      <div
        className={cn(
          "grid grid-flow-row grid-cols-17 rounded-xl text-center",
          title.includes("GOLD")
            ? "bg-gradient-to-b from-champ-400"
            : "mt-12 bg-gradient-to-b from-zinc-300",
        )}
      >
        <div
          className={cn(
            "col-span-17 my-2 font-varela text-2xl font-extrabold",
            title.includes("GOLD") ? "text-champ-900" : "text-zinc-600",
          )}
        >
          {title}
        </div>
        <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
          <TableHeaderCell className="text-xs font-bold sm:text-sm">
            Rank
          </TableHeaderCell>
          <TableHeaderCell className="col-span-5 text-base font-bold sm:text-lg">
            Name
          </TableHeaderCell>
          <TableHeaderCell className="col-span-2 text-xs font-bold xs:text-sm sm:text-base">
            Cup Points
          </TableHeaderCell>
          <TableHeaderCell className="col-span-2 text-2xs xs:text-xs sm:text-sm">
            Starting Strokes
          </TableHeaderCell>
        </div>
      </div>
    </PopoverTrigger>
    <PopoverContent className="w-fit">
      <PointsAndPayoutsPopover tier={tier} />
    </PopoverContent>
  </Popover>
);

const GoldPlayoffHeader = ({ tier }: { tier: Tier }) => (
  <PlayoffHeader title="PGC GOLD PLAYOFF" tier={tier} />
);

const SilverPlayoffHeader = ({ tier }: { tier: Tier }) => (
  <PlayoffHeader title="PGC SILVER PLAYOFF" tier={tier} />
);

// --- Unified Header Component ---
export type StandingsTableHeaderVariant =
  | "regular"
  | "gold"
  | "silver"
  | "bumped";

export interface StandingsTableHeaderProps {
  variant: StandingsTableHeaderVariant;
  tier?: Tier;
}

export function StandingsTableHeader({
  variant,
  tier,
}: StandingsTableHeaderProps) {
  if (variant === "gold" && tier) {
    return <GoldPlayoffHeader tier={tier} />;
  }
  if (variant === "silver" && tier) {
    return <SilverPlayoffHeader tier={tier} />;
  }
  if (variant === "bumped") {
    return <BumpedHeader />;
  }
  // default to regular
  return <RegularStandingsHeader />;
}
