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
} from "@/lib/components/functionalComponents/ui/popover";
import type { Tier, Tournament } from "@prisma/client";
import { getLeaderboardHeaderData } from "@/server/actions/leaderboard-header";
import { formatTournamentDateRange } from "@/lib/utils/domain/dates";
import {
  formatMoney,
  formatRank,
  formatNumber,
} from "@/lib/utils/domain/formatting";
import { MAX_PAYOUTS_DISPLAY, YARDAGE_PRECISION } from "@/lib/utils/constants";
import { CoursePopover } from "./CoursePopover";
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
} from "@/lib/components/functionalComponents/ui/dropdown-menu";
import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import { cn } from "@/lib/utils/core";
import type { Course } from "@prisma/client";

interface LeaderboardHeaderProps {
  focusTourney: Tournament;
}

export default async function LeaderboardHeader({
  focusTourney,
}: LeaderboardHeaderProps) {
  // Fetch all static data using server action with utility functions
  const { course, tier, groupedTournaments, tiers, courses } =
    await getLeaderboardHeaderData(focusTourney);

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
            groupedTournaments={groupedTournaments.byTier}
            tiers={tiers}
            courses={courses}
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
            {course?.name}
          </PopoverTrigger>
          <PopoverContent>
            <CoursePopover tournament={focusTourney} />
          </PopoverContent>
        </Popover>

        {/* Course Location */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {course?.location}
        </div>

        {/* Course Details */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {course?.front && course?.back && course?.par
            ? `${formatNumber(course.front, YARDAGE_PRECISION)} - ${formatNumber(course.back, YARDAGE_PRECISION)} - ${formatNumber(course.par, YARDAGE_PRECISION)}`
            : "-"}
        </div>

        {/* Tier Information Popover */}
        <Popover>
          <PopoverTrigger className="col-span-7 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {tier?.name} Tournament -{" "}
            {`1st Place: ${tier?.points[0] ?? 0} pts, ${formatMoney(tier?.payouts[0] ?? 0)}`}
          </PopoverTrigger>
          <PopoverContent>
            <PointsAndPayoutsPopover tier={tier} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function PointsAndPayoutsPopover({ tier }: { tier: Tier | undefined }) {
  return (
    <div className="grid grid-cols-3 text-center">
      {/* Rank Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, MAX_PAYOUTS_DISPLAY).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
      {/* Payouts Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier?.payouts.slice(0, MAX_PAYOUTS_DISPLAY).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>
      {/* Points Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Points</div>
        {tier?.points.slice(0, MAX_PAYOUTS_DISPLAY).map((points) => (
          <div key={"points-" + points} className="text-xs">
            {formatNumber(points, YARDAGE_PRECISION)}
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
  groupedTournaments,
  tiers,
  courses,
  isLoading = false,
}: {
  activeTourney?: { id: string };
  groupedTournaments: any[];
  tiers: Tier[];
  courses: Course[];
  isLoading?: boolean;
}) {
  const [tierEffect, setTierEffect] = useState(false);
  const [dateEffect, setDateEffect] = useState(false);
  const [leaderboardToggle, setLeaderboardToggle] = useState<"Tier" | "Date">(
    "Tier",
  );

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
          {groupedTournaments.map((group, i) => (
            <div className="px-1" key={`group-${i}`}>
              {i !== 0 && (
                <DropdownMenuSeparator
                  key={`sep-${i}`}
                  className="mx-auto h-[1px] w-11/12 bg-slate-700"
                />
              )}
              {leaderboardToggle === "Tier" && (
                <DropdownMenuLabel className="text-center font-bold xs:text-lg lg:text-xl">
                  {tiers.find((tier) => tier.id === group[0]?.tierId)?.name ||
                    `Group ${i + 1}`}
                </DropdownMenuLabel>
              )}
              {group.map((tourney: any) => (
                <DropdownMenuItem key={tourney.id} asChild className="py-0.5">
                  <Link
                    className="outline-none"
                    href={`/tournament/${tourney.id}`}
                  >
                    <TournamentItem
                      tourney={tourney}
                      tier={tiers.find((tier) => tier.id === tourney.tierId)}
                      course={courses.find(
                        (course) => course.id === tourney.courseId,
                      )}
                      isActive={activeTourney?.id === tourney.id}
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
  tier,
  course,
  isActive,
}: {
  tourney: any;
  tier: Tier | undefined;
  course: Course | undefined;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full select-none flex-row items-center justify-center rounded-md p-0.5 text-xs outline-none xs:text-sm sm:text-lg",
        tier?.name === "Major" && "bg-slate-100",
        tier?.name === "Playoff" && "bg-champ-100",
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
        {formatTournamentDateRange(
          tourney.startDate,
          tourney.endDate,
          course?.location,
        )}
      </div>
    </div>
  );
}
