"use client";

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
import Image from "next/image";
import { cn } from "@/lib/utils/core";
import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import { useMainStore } from "@/lib/store/store";
import type { Course, Tier, Tournament } from "@prisma/client";

/**
 * HeaderDropdown Component
 *
 * Displays a dropdown menu for selecting tournaments.
 * - Allows toggling between viewing tournaments by tier or by date.
 * - Displays a loading spinner while fetching data.
 *
 * Props:
 * - activeTourney: The currently active tournament (optional).
 * - seasonId: The current season ID (optional).
 */
export default function HeaderDropdown({
  activeTourney,
}: {
  activeTourney?: { id: string };
}) {
  const [tierEffect, setTierEffect] = useState(false);
  const [dateEffect, setDateEffect] = useState(false);
  const [leaderboardToggle, setLeaderboardToggle] = useState("Date");

  const tiers = useMainStore((state) => state.currentTiers)?.sort(
    (a, b) => (b.points[0] ?? 0) - (a.points[0] ?? 0),
  );
  const tournaments = useMainStore((state) => state.seasonTournaments);
  const currentTourney = useMainStore((state) => state.currentTournament);
  const tournamentsByTier = currentTourney
    ? [
        [currentTourney],
        ...(tiers?.map((t) =>
          tournaments?.filter((tourney) => tourney.tierId === t.id),
        ) ?? []),
      ]
    : (tiers?.map((t) =>
        tournaments?.filter((tourney) => tourney.tierId === t.id),
      ) ?? []);
  if (!tiers || !tournaments)
    return (
      <div
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-5 py-0.5 text-slate-100 shadow-lg md:px-5 md:py-1"
        aria-label="Customise options"
      >
        <LoadingSpinner className="my-0 h-[1.5rem] w-[1.5rem] border-gray-100 border-t-gray-800" />
      </div>
    );

  const groupedTourneys =
    leaderboardToggle === "Tier" ? tournamentsByTier : [tournaments];

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
            {...{
              tierEffect,
              setTierEffect,
              dateEffect,
              setDateEffect,
              leaderboardToggle,
              setLeaderboardToggle,
            }}
          />
          {groupedTourneys.map((group, i) => (
            <div className="px-1" key={`group-${i}`}>
              {i !== 0 && (
                <DropdownMenuSeparator
                  key={`sep-${i}`}
                  className="mx-auto h-[1px] w-11/12 bg-slate-700"
                />
              )}
              {leaderboardToggle === "Tier" && (
                <DropdownMenuLabel className="text-center font-bold xs:text-lg lg:text-xl">
                  {groupedTourneys.length === 5 && i === 0
                    ? "Live"
                    : tiers?.find((tier) => tier.id === group?.[0]?.tierId)
                        ?.name}
                </DropdownMenuLabel>
              )}
              {group?.map((tourney) => (
                <DropdownMenuItem key={tourney.id} asChild className="py-0.5">
                  <Link
                    className="outline-none"
                    href={{
                      pathname: "/tournament",
                      search: `?id=${
                        leaderboardToggle === "Tier" &&
                        groupedTourneys.length === 4 &&
                        i === 0
                          ? ""
                          : tourney.id
                      }`,
                    }}
                  >
                    <TournamentItem
                      tourney={tourney}
                      tier={tiers?.find((tier) => tier.id === tourney.tierId)}
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
 *
 * Props:
 * - tierEffect: Boolean indicating if the "By Tier" button is active.
 * - setTierEffect: Function to set the "By Tier" button effect.
 * - dateEffect: Boolean indicating if the "By Date" button is active.
 * - setDateEffect: Function to set the "By Date" button effect.
 * - leaderboardToggle: The current toggle state ("Tier" or "Date").
 * - setLeaderboardToggle: Function to set the toggle state.
 */
function DropdownToggle({
  tierEffect,
  setTierEffect,
  dateEffect,
  setDateEffect,
  leaderboardToggle,
  setLeaderboardToggle,
}: {
  tierEffect: boolean;
  setTierEffect: Dispatch<SetStateAction<boolean>>;
  dateEffect: boolean;
  setDateEffect: Dispatch<SetStateAction<boolean>>;
  leaderboardToggle: string;
  setLeaderboardToggle: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className="mb-2 w-full min-w-[250px] text-center">
      <button
        onClick={() => {
          setLeaderboardToggle("Tier");
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
          setLeaderboardToggle("Date");
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
 *
 * Props:
 * - tourney: The tournament data.
 * - isActive: Boolean indicating if the tournament is currently active.
 */
function TournamentItem({
  tourney,
  tier,
  isActive,
}: {
  tourney: Tournament;
  tier: Tier | undefined;
  isActive: boolean;
}) {
  const { courses } = useCourses();
  const course = courses?.find((c: Course) => c.id === tourney.courseId);
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
