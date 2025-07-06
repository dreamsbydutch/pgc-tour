"use client";

/**
 * LeaderboardHeader Component
 *
 * Simple, functional header component. Uses one hook call at the top for all data,
 * then renders pure UI. Clean, simple data flow.
 */

"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import Link from "next/link";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "@/lib/components/ui/popover";
import type { DatagolfCourseInputData } from "@/lib/types";
import type { Tier, Tournament, Course } from "@prisma/client";
import { formatMoney, formatRank } from "@/lib/utils/domain/formatting";
import { cn } from "@/lib/utils/core";
import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import type { LeaderboardHeaderData } from "@/server/actions";
import { useOptimizedLeaderboardHeader } from "@/lib/hooks/useOptimizedLeaderboardHeader";

export type TournamentWithIncludes = Tournament & {
  course: Course;
  tier: Tier;
};

export type TournamentGroup = TournamentWithIncludes[][];

interface LeaderboardHeaderProps {
  focusTourney: Tournament;
  serverData: LeaderboardHeaderData;
}

/**
 * Main LeaderboardHeader Component
 *
 * Simple functional component with one hook call for all data/logic.
 */
export default function LeaderboardHeader({
  focusTourney,
  serverData,
}: LeaderboardHeaderProps) {
  // Single hook call for all data and logic
  const {
    course,
    tier,
    courseData,
    courseDataLoading,
    groupedTournaments,
    dropdownTiers,
    dropdownCourses,
    leaderboardToggle,
    onToggleChange,
    getTierName,
    getTournamentHref,
  } = useOptimizedLeaderboardHeader(
    focusTourney,
    serverData.course,
    serverData.tier,
    serverData.tournaments,
    serverData.tiers,
  );
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
            groupedTournaments={groupedTournaments}
            tiers={dropdownTiers}
            courses={dropdownCourses}
            isLoading={false} // No loading since we use server data
            leaderboardToggle={leaderboardToggle}
            onToggleChange={onToggleChange}
            getTierName={getTierName}
            getTournamentHref={getTournamentHref}
          />
        </div>

        {/* Tournament Date Range */}
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${new Date(focusTourney.startDate).toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
          })} - ${
            new Date(focusTourney.startDate).getMonth() ===
            new Date(focusTourney.endDate).getMonth()
              ? new Date(focusTourney.endDate).toLocaleDateString("en-us", {
                  day: "numeric",
                })
              : new Date(focusTourney.endDate).toLocaleDateString("en-us", {
                  month: "short",
                  day: "numeric",
                })
          }`}
        </div>

        {/* Course Name Popover */}
        <Popover>
          <PopoverTrigger className="col-span-3 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {course?.name}
          </PopoverTrigger>
          <PopoverContent>
            <CoursePopover
              focusTourney={focusTourney}
              courseData={courseData}
              isLoading={courseDataLoading}
            />
          </PopoverContent>
        </Popover>

        {/* Course Location */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {course?.location}
        </div>

        {/* Course Details */}
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${course?.front} - ${course?.back} - ${course?.par}`}
        </div>

        {/* Tier Information Popover */}
        <Popover>
          <PopoverTrigger className="col-span-7 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {tier?.name} Tournament -{" "}
            {`1st Place: ${tier?.points[0] ?? 0} pts, ${Intl.NumberFormat(
              "en-US",
              {
                style: "currency",
                currency: "USD",
              },
            ).format(tier?.payouts[0] ?? 0)}`}
          </PopoverTrigger>
          <PopoverContent>
            <PointsAndPayoutsPopover {...{ tier }} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/**
 * PointsAndPayoutsPopover Component
 *
 * Displays a popover with the points and payouts for the tournament.
 *
 * Props:
 * - focusTourney: The tournament data containing tier information.
 */
function PointsAndPayoutsPopover({ tier }: { tier: Tier | null | undefined }) {
  return (
    <div className="grid grid-cols-3 text-center">
      {/* Rank Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>

      {/* Payouts Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier?.payouts.slice(0, 35).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>

      {/* Points Column */}
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Points</div>
        {tier?.points.slice(0, 35).map((points) => (
          <div key={"points-" + points} className="text-xs">
            {points.toString()}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CoursePopover Component
 *
 * Displays a popover with course details, including hole-by-hole information.
 * - Shows yardage, par, and average score for each hole.
 * - Receives course data as props to maintain component purity.
 *
 * Props:
 * - focusTourney: The tournament data containing course information.
 * - courseData: The course data from DataGolf API.
 * - isLoading: Whether the course data is currently loading.
 */
function CoursePopover({
  focusTourney,
  courseData,
  isLoading,
}: {
  focusTourney: Tournament;
  courseData: DatagolfCourseInputData | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="p-4 text-center text-gray-500">
        Course data not available
      </div>
    );
  }

  return (
    <>
      {courseData.courses[0]?.rounds
        ?.find((round) => round.round_num === focusTourney.currentRound)
        ?.holes?.map((hole, i) => {
          const holes = courseData.courses[0]?.rounds
            .map(
              (round) =>
                round.holes.find((h) => h.hole === hole.hole)?.total.avg_score,
            )
            .flat();

          const averageScore =
            (holes?.reduce((sum, score) => (sum ?? 0) + (score ?? 0), 0) ?? 0) /
            (holes?.length ?? 1);

          return (
            <div
              key={i}
              className="grid grid-cols-4 border-slate-800 py-0.5 text-center [&:nth-child(9)]:border-b"
            >
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{formatRank(hole.hole)} Hole</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{hole.yardage} yards</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">Par {hole.par}</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div
                  className={cn(
                    "text-xs",
                    averageScore - hole.par > 0
                      ? "text-red-900"
                      : averageScore - hole.par < 0
                        ? "text-green-900"
                        : "",
                  )}
                >
                  {averageScore - hole.par === 0
                    ? "E"
                    : (averageScore - hole.par > 0 ? "+" : "") +
                      Math.round((averageScore - hole.par) * 1000) / 1000}
                </div>
              </div>
            </div>
          );
        })}
    </>
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
  leaderboardToggle,
  onToggleChange,
  getTierName,
  getTournamentHref,
}: {
  activeTourney?: { id: string };
  groupedTournaments: TournamentGroup;
  tiers: Tier[];
  courses: Course[];
  isLoading?: boolean;
  leaderboardToggle: "Tier" | "Date";
  onToggleChange: (toggle: "Tier" | "Date") => void;
  getTierName: (
    tierName: string | undefined,
    groupIndex: number,
    isLive: boolean,
  ) => string;
  getTournamentHref: (
    tournamentId: string,
    viewMode: string,
    groupIndex: number,
    hasLiveTournament: boolean,
  ) => string;
}) {
  const [tierEffect, setTierEffect] = useState(false);
  const [dateEffect, setDateEffect] = useState(false);

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
            onToggleChange={onToggleChange}
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
                  {getTierName(
                    tiers.find((tier) => tier.id === group[0]?.tierId)?.name,
                    i,
                    groupedTournaments.length === 5,
                  )}
                </DropdownMenuLabel>
              )}
              {group.map((tourney) => (
                <DropdownMenuItem key={tourney.id} asChild className="py-0.5">
                  <Link
                    className="outline-none"
                    href={getTournamentHref(
                      tourney.id,
                      leaderboardToggle,
                      i,
                      groupedTournaments.length === 5,
                    )}
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
  tourney: TournamentWithIncludes;
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
      <div
        className={cn("pl-3 text-2xs text-slate-600 xs:text-xs")}
      >{`${new Date(tourney.startDate).toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
      })}-${
        new Date(tourney.startDate).getMonth() ===
        new Date(tourney.endDate).getMonth()
          ? new Date(tourney.endDate).toLocaleDateString("en-us", {
              day: "numeric",
            })
          : new Date(tourney.endDate).toLocaleDateString("en-us", {
              month: "short",
              day: "numeric",
            })
      } - ${course?.location}`}</div>
    </div>
  );
}
