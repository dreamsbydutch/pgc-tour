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
} from "@/src/app/_components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/src/trpc/react";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";

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
  seasonId,
}: {
  activeTourney?: { id: string };
  seasonId?: string;
}) {
  const [tierEffect, setTierEffect] = useState(false);
  const [dateEffect, setDateEffect] = useState(false);
  const [leaderboardToggle, setLeaderboardToggle] = useState("Date");

  const data = useLeaderboardHeaderInfo({ seasonId });

  if (!data)
    return (
      <div
        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-600 px-5 py-0.5 text-slate-100 shadow-lg md:px-5 md:py-1"
        aria-label="Customise options"
      >
        <LoadingSpinner className="my-0 h-[1.5rem] w-[1.5rem] border-gray-100 border-t-gray-800" />
      </div>
    );

  const { tiers, tournaments, tournamentsByTier } = data;
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
                  className="h-[1px] bg-slate-700"
                />
              )}
              {leaderboardToggle === "Tier" && (
                <DropdownMenuLabel className="pb-1 text-center font-bold xs:text-lg lg:text-xl">
                  {groupedTourneys.length === 4 && i === 0
                    ? "Live"
                    : tiers.find((tier) => tier.id === group[0]?.tierId)?.name}
                </DropdownMenuLabel>
              )}
              {group.map((tourney) => (
                <DropdownMenuItem key={tourney.id} asChild>
                  <Link
                    className="py-0 outline-none"
                    href={`/tournament/${
                      leaderboardToggle === "Tier" &&
                      groupedTourneys.length === 4 &&
                      i === 0
                        ? ""
                        : tourney.id
                    }`}
                  >
                    <TournamentItem
                      tourney={{
                        ...tourney,
                        logoUrl: tourney.logoUrl ?? undefined,
                      }}
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
        className={`${tierEffect && "animate-toggleClick"} w-1/2 px-6 py-1 text-lg font-bold sm:px-8 md:px-10${
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
        className={`${dateEffect && "animate-toggleClick"} w-1/2 px-6 py-1 text-lg font-bold sm:px-8 md:px-10${
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
  isActive,
}: {
  tourney: {
    id: string;
    name: string;
    logoUrl?: string;
    startDate: Date;
    endDate: Date;
    course: { location: string };
  };
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full select-none flex-row items-center justify-center px-2 py-1.5 text-xs outline-none xs:text-sm sm:text-lg",
        isActive && "rounded-lg bg-slate-200",
      )}
    >
      <div className="flex items-center gap-2">
        {tourney.logoUrl && (
          <Image
            src={tourney.logoUrl}
            alt={`${tourney.name} logo`}
            width={28}
            height={28}
          />
        )}
        {tourney.name}
      </div>
      <div className="text-2xs text-slate-500 xs:text-xs">{`${tourney.startDate.toLocaleDateString(
        "en-us",
        {
          month: "short",
          day: "numeric",
        },
      )} - ${
        tourney.startDate.getMonth() === tourney.endDate.getMonth()
          ? tourney.endDate.toLocaleDateString("en-us", {
              day: "numeric",
            })
          : tourney.endDate.toLocaleDateString("en-us", {
              month: "short",
              day: "numeric",
            })
      } - ${tourney.course.location}`}</div>
    </div>
  );
}

/**
 * useLeaderboardHeaderInfo Hook
 *
 * Fetches data for the leaderboard header, including:
 * - Tiers for the season.
 * - Tournaments for the season.
 * - Tournaments grouped by tier.
 *
 * Props:
 * - seasonId: The current season ID (optional).
 *
 * @returns An object containing tiers, tournaments, and tournaments grouped by tier.
 */
function useLeaderboardHeaderInfo({
  seasonId,
}: {
  seasonId: string | undefined;
}) {
  const date = new Date();
  const year = 2025;

  const { data: season } = api.season.getByYear.useQuery({ year });
  const { data: tiers } = api.tier.getBySeason.useQuery({
    seasonId: season?.id ?? "",
  });
  const { data: tournaments } = api.tournament.getBySeason.useQuery({
    seasonId: seasonId ?? season?.id ?? "",
  });

  if (!tiers || !tournaments) return null;

  const currentTourneyID = tournaments.find(
    (tourney) => tourney.startDate < date && tourney.endDate > date,
  )?.id;

  const tournamentsByTier = currentTourneyID
    ? [
        tournaments.filter((obj) => obj.id === currentTourneyID),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Major")?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Elevated")?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Standard")?.id,
        ),
      ]
    : [
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Major")?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Elevated")?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.find((tier) => tier.name === "Standard")?.id,
        ),
      ];

  return { tiers, tournaments, tournamentsByTier };
}
