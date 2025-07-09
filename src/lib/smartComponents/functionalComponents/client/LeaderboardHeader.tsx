"use client";

/**
 * LeaderboardHeader Server Component
 *
 * Server component that handles all static tournament data.
 * Uses server actions for data fetching and utility functions for processing.
 * Only the CoursePopover is a client component for live data.
 */

import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import LoadingSpinner from "@/lib/smartComponents/functionalComponents/loading/LoadingSpinner";
import {
  cn,
  formatMoney,
  formatNumber,
  formatRank,
  formatTournamentDateRange,
} from "@/lib/utils/main";
import { CoursePopover } from "../../client/CoursePopover";
import type { Tournament, Tier, Course } from "@prisma/client";

// Define a type for the grouped tournament dropdown items using Pick
// Only the fields required for rendering are included

type TournamentDropdownItem = Pick<
  Tournament,
  "id" | "logoUrl" | "name" | "startDate" | "endDate"
> & {
  tier: Pick<Tier, "name">;
  course: Pick<Course, "location">;
};
type InputTournaments = TournamentDropdownItem[];

// Pure presentational component
interface LeaderboardHeaderProps {
  focusTourney: Pick<
    Tournament,
    "id" | "logoUrl" | "name" | "startDate" | "endDate" | "currentRound"
  > & {
    course:
      | Pick<Course, "name" | "location" | "par" | "front" | "back">
      | undefined;
    tier: Pick<Tier, "name" | "points" | "payouts"> | undefined;
  };
  inputTournaments: InputTournaments;
  isLoading?: boolean;
}

export function LeaderboardHeader({
  focusTourney,
  inputTournaments,
}: LeaderboardHeaderProps) {
  return (
    <div
      id={`leaderboard-header-${focusTourney.id}`}
      className="mx-auto w-full max-w-4xl md:w-11/12 lg:w-8/12"
    >
      <div className="mx-auto grid grid-flow-row grid-cols-10 items-center border-b-2 border-gray-800 py-2">
        {/* Tournament Logo */}
        <div className="col-span-3 row-span-4 max-h-40 place-self-center px-1 py-2 text-center font-varela">
          {focusTourney.logoUrl && (
            <Image
              src={focusTourney.logoUrl}
              className="max-h-32"
              alt={`${focusTourney.name} logo`}
              width={150}
              height={150}
            />
          )}
        </div>

        {/* Tournament Name */}
        <div className="col-span-5 row-span-2 place-self-center text-center font-varela text-xl font-bold xs:text-2xl sm:text-3xl lg:text-4xl">
          {focusTourney.name}
        </div>

        {/* Tournament Dropdown */}
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-xs xs:text-sm sm:text-base md:text-lg">
          <HeaderDropdown
            activeTourney={focusTourney}
            tournaments={inputTournaments}
          />
        </div>

        {/* Tournament Date Range */}
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {formatTournamentDateRange(
            focusTourney.startDate,
            focusTourney.endDate,
          )}
        </div>

        {/* Course Name Popover */}
        <Popover>
          <PopoverTrigger className="col-span-3 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {focusTourney.course?.name}
          </PopoverTrigger>
          <PopoverContent>
            <CoursePopover currentRound={focusTourney.currentRound} />
          </PopoverContent>
        </Popover>

        {/* Course Location */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.course?.location}
        </div>

        {/* Course Details */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.course?.front &&
          focusTourney.course?.back &&
          focusTourney.course?.par
            ? `${formatNumber(focusTourney.course.front, 1)} - ${formatNumber(focusTourney.course.back, 1)} - ${formatNumber(focusTourney.course.par, 1)}`
            : "-"}
        </div>

        {/* Tier Information Popover */}
        <Popover>
          <PopoverTrigger className="col-span-7 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {focusTourney.tier?.name} Tournament -{" "}
            {`1st Place: ${focusTourney.tier?.points[0] ?? 0} pts, ${formatMoney(focusTourney.tier?.payouts[0] ?? 0)}`}
          </PopoverTrigger>
          <PopoverContent>
            {focusTourney.tier && (
              <PointsAndPayoutsPopover tier={focusTourney.tier} />
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function PointsAndPayoutsPopover({
  tier,
}: {
  tier: { points: number[]; payouts: number[] };
}) {
  return (
    <div className="grid grid-cols-3 text-center">
      {/* Rank Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
      {/* Payouts Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier.payouts.slice(0, 35).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>
      {/* Points Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Points</div>
        {tier.points.slice(0, 35).map((points) => (
          <div key={"points-" + points} className="text-xs">
            {formatNumber(points, 1)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HeaderDropdown Component
 *
 * Tournament selection dropdown component integrated within the leaderboard header.
 * A purely functional component that displays a dropdown menu for selecting tournaments.
 */
function HeaderDropdown({
  activeTourney,
  tournaments,
  isLoading = false,
}: {
  activeTourney?: Pick<Tournament, "id">;
  tournaments: TournamentDropdownItem[];
  isLoading?: boolean;
}) {
  const [tierEffect, setTierEffect] = useState(false);
  const [dateEffect, setDateEffect] = useState(false);
  const [leaderboardToggle, setLeaderboardToggle] = useState<"Tier" | "Date">(
    "Tier",
  );

  // Group tournaments by tier name
  const groupByTier = (tournaments: TournamentDropdownItem[]) => {
    const groups: Record<string, TournamentDropdownItem[]> = {};
    tournaments.forEach((item) => {
      const tier = item.tier?.name || "Other";
      if (!groups[tier]) groups[tier] = [];
      groups[tier].push(item);
    });
    // Sort tiers by custom order
    const tierOrder = ["Standard", "Elevated", "Major", "Playoff"];
    return Object.entries(groups)
      .sort((a, b) => {
        const aIdx = tierOrder.indexOf(a[0]);
        const bIdx = tierOrder.indexOf(b[0]);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      })
      .map(([_tier, items]) =>
        items.sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        ),
      );
  };

  // Sorting logic for dropdown
  let displayTournaments: TournamentDropdownItem[][];
  if (leaderboardToggle === "Date") {
    // Single group, sorted by ascending startDate
    displayTournaments = [
      [...tournaments].sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
    ];
  } else {
    // Group by tier, then sort inside each group by startDate
    displayTournaments = groupByTier(tournaments);
  }

  if (isLoading) {
    return (
      <div
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-5 py-0.5 text-slate-100 shadow-lg md:px-5 md:py-1"
        aria-label="Customise options"
      >
        <LoadingSpinner className="my-0 h-[1.5rem] w-[1.5rem] border-gray-100 border-t-gray-800" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-3 py-0.5 text-slate-100 shadow-lg md:px-5 md:py-1"
          aria-label="Customise options"
        >
          All <ChevronDown />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          className="max-h-[70vh] overflow-y-scroll rounded-lg bg-white p-0 shadow-lg"
          sideOffset={5}
        >
          <DropdownToggle
            tierEffect={tierEffect}
            setTierEffect={setTierEffect}
            dateEffect={dateEffect}
            setDateEffect={setDateEffect}
            leaderboardToggle={leaderboardToggle}
            onToggleChange={setLeaderboardToggle}
          />
          {displayTournaments.map((group, i) => (
            <div className="px-1" key={`group-${i}`}>
              {i !== 0 && (
                <DropdownMenuSeparator
                  key={`sep-${i}`}
                  className="mx-auto h-[1px] w-11/12 bg-slate-700"
                />
              )}
              {leaderboardToggle === "Tier" && group[0]?.tier?.name && (
                <DropdownMenuLabel className="text-center font-bold xs:text-lg lg:text-xl">
                  {group[0]?.tier?.name}
                </DropdownMenuLabel>
              )}
              {group.map((tournament) => (
                <DropdownMenuItem
                  key={tournament.id}
                  asChild
                  className="py-0.5"
                >
                  <Link
                    className="outline-none"
                    href={`/tournament/${tournament.id}`}
                  >
                    <TournamentItem
                      tourney={tournament}
                      isActive={activeTourney?.id === tournament.id}
                    />
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

/**
 * DropdownToggle Component
 *
 * Renders toggle buttons to switch between viewing tournaments by tier or by date.
 */
function DropdownToggle({
  tierEffect,
  setTierEffect,
  dateEffect,
  setDateEffect,
  leaderboardToggle,
  onToggleChange,
}: {
  tierEffect: boolean;
  setTierEffect: Dispatch<SetStateAction<boolean>>;
  dateEffect: boolean;
  setDateEffect: Dispatch<SetStateAction<boolean>>;
  leaderboardToggle: "Tier" | "Date";
  onToggleChange: (toggle: "Tier" | "Date") => void;
}) {
  return (
    <div className="mb-2 w-full min-w-[250px] text-center">
      <button
        onClick={() => {
          onToggleChange("Tier");
          setTierEffect(true);
        }}
        className={`${tierEffect && "animate-toggleClick"} w-1/2 text-nowrap px-6 py-1 text-lg font-bold sm:px-8 md:px-10${
          leaderboardToggle === "Tier"
            ? "shadow-btn bg-gray-600 text-gray-300"
            : "shadow-btn bg-gray-300 text-gray-800"
        }`}
        onAnimationEnd={() => setTierEffect(false)}
      >
        By Tier
      </button>
      <button
        onClick={() => {
          onToggleChange("Date");
          setDateEffect(true);
        }}
        className={`${dateEffect && "animate-toggleClick"} w-1/2 text-nowrap px-6 py-1 text-lg font-bold sm:px-8 md:px-10${
          leaderboardToggle === "Date"
            ? "shadow-btn bg-gray-600 text-gray-300"
            : "shadow-btn bg-gray-300 text-gray-800"
        }`}
        onAnimationEnd={() => setDateEffect(false)}
      >
        By Date
      </button>
    </div>
  );
}

/**
 * TournamentItem Component
 *
 * Renders a single tournament item in the dropdown menu.
 */
function TournamentItem({
  tourney,
  isActive,
}: {
  tourney: Pick<Tournament, "logoUrl" | "name" | "startDate" | "endDate"> & {
    tier: Pick<Tier, "name">;
    course: Pick<Course, "location">;
  };
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full select-none flex-row items-center justify-center rounded-md p-0.5 text-xs outline-none xs:text-sm sm:text-lg",
        tourney.tier?.name === "Major" && "bg-slate-100",
        tourney.tier?.name === "Playoff" && "bg-champ-100",
        isActive && "font-bold",
      )}
    >
      <div className="flex items-center justify-start gap-2">
        {tourney.logoUrl && (
          <Image
            src={tourney.logoUrl}
            alt={`${tourney.name} logo`}
            width={28}
            height={28}
            className="h-7 w-7"
          />
        )}
        {tourney.name}
      </div>
      <div className={cn("pl-3 text-2xs text-slate-600 xs:text-xs")}>
        {formatTournamentDateRange(tourney.startDate, tourney.endDate)}
      </div>
    </div>
  );
}
