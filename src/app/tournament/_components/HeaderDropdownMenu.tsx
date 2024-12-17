"use client";

import { Tournament } from "@prisma/client";
import { ChevronDown, Loader2 } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../_components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import {
  TournamentData,
} from "@/src/types/prisma_include";
import { api } from "@/src/trpc/react";
import { cn } from "@/lib/utils";

export default function HeaderDropdown({
  activeTourney,
  seasonId,
}: {
  activeTourney?: Tournament;
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
        <Loader2 className="h-[1.5rem] w-[1.5rem] border-gray-100 border-t-gray-800" />
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
          className="max-h-[70vh] overflow-y-scroll rounded-lg bg-white shadow-lg"
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
          {groupedTourneys.map((group, i) => {
            return (
              <div className="px-1" key={`group-${i}`}>
                {i !== 0 && (
                  <DropdownMenuSeparator
                    key={`sep-${i}`}
                    className="m-1 h-[1px] bg-slate-700"
                  />
                )}
                <DropdownMenuLabel className="pb-2 text-center font-bold xs:text-lg lg:text-xl">
                  {leaderboardToggle === "Tier"
                    ? groupedTourneys.length === 4 && i === 0
                      ? "Live"
                      : tiers.filter((a) => a.id === group[0]?.tierId)[0]?.name
                    : ""}
                </DropdownMenuLabel>
                {group.map((tourney) => {
                  return (
                    <DropdownMenuItem key={tourney.id} asChild>
                      <Link
                        className="outline-none"
                        href={`/tournament/${leaderboardToggle === "Tier" && groupedTourneys.length === 4 && i === 0 ? "" : tourney.id}`}
                      >
                        <div
                          className={cn(
                            "select-none flex-row items-center justify-center px-2 py-1 text-xs outline-none xs:text-sm sm:text-lg",
                            activeTourney?.id === tourney.id &&
                              "rounded-lg bg-slate-200",
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
                            tourney.startDate.getMonth() ===
                            tourney.endDate.getMonth()
                              ? tourney.endDate.toLocaleDateString("en-us", {
                                  day: "numeric",
                                })
                              : tourney.endDate.toLocaleDateString("en-us", {
                                  month: "short",
                                  day: "numeric",
                                })
                          } - ${tourney.course.location}`}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

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

function useLeaderboardHeaderInfo({
  seasonId,
}: {
  seasonId: string | undefined;
}) {
  const date = new Date();
  const year = date.getFullYear();

  const { data: season } = api.season.getByYear.useQuery({ year });
  const { data: tiers } = api.tier.getBySeason.useQuery({
    seasonId: season?.id || "",
  });
  const { data: tournaments } = api.tournament.getBySeason.useQuery({
    seasonId: seasonId ?? season?.id,
  });
  if (!tiers || !tournaments) return null;

  const currentTourneyID = tournaments.filter(
    (tourney) => tourney.startDate < date && tourney.endDate > date,
  )[0]?.id;

  console.log(tournaments);

  const tournamentsByTier: TournamentData[][] = currentTourneyID
    ? [
        tournaments.filter((obj) => obj.id === currentTourneyID),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Major")[0]?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Mid")[0]?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Bottom")[0]?.id,
        ),
      ]
    : [
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Major")[0]?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Mid")[0]?.id,
        ),
        tournaments.filter(
          (obj) =>
            obj.tierId === tiers.filter((a) => a.name === "Bottom")[0]?.id,
        ),
      ];

  return { tiers, tournaments, tournamentsByTier };
}
