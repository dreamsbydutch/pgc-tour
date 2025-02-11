"use client";

import { cn, formatScore } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import type {
  TeamData,
  TourCardData,
  TourData,
  TournamentData,
} from "@/src/types/prisma_include";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "../../_components/ui/table";

export default function StatsPage({
  tournament,
  tours,
  tourCard,
}: {
  tournament: TournamentData;
  tours: TourData[];
  tourCard?: TourCardData;
}) {
  const [activeTour, setActiveTour] = useState<string>(tourCard?.tourId ?? "");
  const teams = api.team.getByTournament.useQuery(
    {
      tournamentId: tournament?.id ?? "",
    },
    { staleTime: 30 * 1000 },
  ).data;

  return (
    <div className="mt-2">
      <Link
        className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
        href={`/tournament/${tournament.id}`}
      >
        <ArrowLeftIcon size={15} /> Back To Tournament
      </Link>
      <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
        {tours.map((tour) => (
          <ToggleButton
            {...{
              tour,
              activeTour,
              setActiveTour,
            }}
            key={tour.id}
          />
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-800 text-center font-bold text-gray-50">
            <TableCell>Rank</TableCell>
            <TableCell colSpan={4}>Name</TableCell>
            <TableCell>Score</TableCell>
            <TableCell colSpan={4}>Round 1</TableCell>
            <TableCell colSpan={4}>Round 2</TableCell>
            <TableCell colSpan={4}>Round 3</TableCell>
            <TableCell colSpan={4}>Round 4</TableCell>
          </TableRow>
        </TableHeader>
        {activeTour === tours.find((tour) => tour.shortForm === "DbyD")?.id ? (
          sortTeamsForSpecialPostions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
            .map((obj) => (
              <StatsListing
                key={obj.id}
                {...{
                  team: obj,
                  teams,
                  activeTour,
                }}
              />
            ))
        ) : activeTour ===
          tours.find((tour) => tour.shortForm === "CCG")?.id ? (
          sortTeamsForSpecialPostions(teams ?? [])
            .filter((team) => team.tourCard.tourId === activeTour)
            .map((obj) => (
              <StatsListing
                key={obj.id}
                {...{
                  team: obj,
                  teams,
                  activeTour,
                }}
              />
            ))
        ) : (
          <div className="py-4 text-center text-lg font-bold">
            Choose a tour using the toggle buttons
          </div>
        )}
      </Table>
    </div>
  );
}

function ToggleButton({
  tour,
  activeTour,
  setActiveTour,
}: {
  tour:
    | {
        id: string;
        name: string;
        logoUrl: string;
        shortForm: string;
        buyIn: number | null;
      }
    | {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        shortForm: string;
        logoUrl: string;
        seasonId: string;
      };
  activeTour: string;
  setActiveTour: Dispatch<SetStateAction<string>>;
}) {
  const [effect, setEffect] = useState(false);
  return (
    <button
      key={tour.id}
      onClick={() => {
        setActiveTour(tour.id);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:text-xl ${
        tour.id === activeTour
          ? "shadow-btn bg-gray-700 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-700"
      }`}
      onAnimationEnd={() => {
        setEffect(false);
      }}
    >
      {tour?.shortForm}
    </button>
  );
}

function sortTeamsForSpecialPostions(teams: TeamData[]) {
  return teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
      (a, b) =>
        (a.position === "DQ"
          ? 999 + (a.score ?? 999)
          : a.position === "WD"
            ? 888 + (a.score ?? 999)
            : a.position === "CUT"
              ? 444 + (a.score ?? 999)
              : (a.score ?? 999)) -
        (b.position === "DQ"
          ? 999 + (b.score ?? 999)
          : b.position === "WD"
            ? 888 + (b.score ?? 999)
            : b.position === "CUT"
              ? 444 + (b.score ?? 999)
              : (b.score ?? 999)),
    );
}

function StatsListing({
  team,
  teams,
  activeTour,
}: {
  team: TeamData;
  teams?: TeamData[];
  activeTour: string;
}) {
  if (!teams) return <></>;
  const tourTeams = teams.filter((a) => a.tourCard.tourId === activeTour);

  return (
    <TableRow className="border-slate-900 text-center">
      <TableCell className="border-l border-slate-900 text-sm">
        {team.position}
      </TableCell>
      <TableCell colSpan={4} className="whitespace-nowrap text-sm">
        {team.tourCard.displayName}
      </TableCell>
      <TableCell className="border-r border-slate-900 text-xs">
        {team.score}
      </TableCell>
      <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
        {team.roundOne}
      </TableCell>
      <TableCell className="text-2xs font-semibold">
        {(tourTeams.filter(
          (a) => (a.roundOne ?? 999) === (team.roundOne ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter((a) => (a.roundOne ?? 999) < (team.roundOne ?? 999))
            .length +
            1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-2xs font-semibold">
        {(tourTeams.filter(
          (a) => (a.roundOne ?? 999) === (team.roundOne ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter((a) => (a.roundOne ?? 999) < (team.roundOne ?? 999))
            .length +
            1)}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
          Math.round(
            ((team.roundOne ?? 999) -
              teams.reduce((p, c) => (p += c.roundOne ?? 999), 0) /
                teams.length) *
              10,
          ) /
            10 <
            0
            ? "bg-green-50 text-green-900"
            : "bg-red-50 text-red-900",
        )}
      >
        {formatScore(
          Math.round(
            ((team.roundOne ?? 999) -
              teams.reduce((p, c) => (p += c.roundOne ?? 999), 0) /
                teams.length) *
              10,
          ) / 10,
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
        {team.roundTwo}
      </TableCell>
      <TableCell className="text-2xs font-semibold">
        {(tourTeams.filter(
          (a) => (a.roundTwo ?? 999) === (team.roundTwo ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter((a) => (a.roundTwo ?? 999) < (team.roundTwo ?? 999))
            .length +
            1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-2xs font-semibold">
        {tourTeams.filter(
          (a) =>
            (a.roundTwo ?? 999) + (a.roundOne ?? 999) <
            (team.roundTwo ?? 999) + (team.roundOne ?? 999),
        ).length + 1}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
          Math.round(
            ((team.roundTwo ?? 999) -
              teams.reduce((p, c) => (p += c.roundTwo ?? 999), 0) /
                teams.length) *
              10,
          ) /
            10 <
            0
            ? "bg-green-50 text-green-900"
            : "bg-red-50 text-red-900",
        )}
      >
        {formatScore(
          Math.round(
            ((team.roundTwo ?? 999) -
              teams.reduce((p, c) => (p += c.roundTwo ?? 999), 0) /
                teams.length) *
              10,
          ) / 10,
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
        {team.roundThree}
      </TableCell>
      <TableCell className="text-2xs font-semibold">
        {(tourTeams.filter(
          (a) => (a.roundThree ?? 999) === (team.roundThree ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter(
            (a) => (a.roundThree ?? 999) < (team.roundThree ?? 999),
          ).length +
            1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-2xs font-semibold">
        {(tourTeams.filter(
          (a) =>
            (a.roundThree ?? 999) +
              (a.roundTwo ?? 999) +
              (a.roundOne ?? 999) ===
            (team.roundThree ?? 999) +
              (team.roundTwo ?? 999) +
              (team.roundOne ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter(
            (a) =>
              (a.roundThree ?? 999) +
                (a.roundTwo ?? 999) +
                (a.roundOne ?? 999) <
              (team.roundThree ?? 999) +
                (team.roundTwo ?? 999) +
                (team.roundOne ?? 999),
          ).length +
            1)}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
          Math.round(
            ((team.roundThree ?? 999) -
              teams.reduce((p, c) => (p += c.roundThree ?? 999), 0) /
                teams.length) *
              10,
          ) /
            10 <
            0
            ? "bg-green-50 text-green-900"
            : "bg-red-50 text-red-900",
        )}
      >
        {formatScore(
          Math.round(
            ((team.roundThree ?? 999) -
              teams.reduce((p, c) => (p += c.roundThree ?? 999), 0) /
                teams.length) *
              10,
          ) / 10,
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
        {team.roundFour}
      </TableCell>
      <TableCell className="text-2xs font-semibold">
        {(tourTeams.filter(
          (a) => (a.roundFour ?? 999) === (team.roundFour ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter(
            (a) => (a.roundFour ?? 999) < (team.roundFour ?? 999),
          ).length +
            1)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-2xs font-semibold">
        {(tourTeams.filter(
          (a) =>
            (a.roundFour ?? 999) +
              (a.roundThree ?? 999) +
              (a.roundTwo ?? 999) +
              (a.roundOne ?? 999) ===
            (team.roundFour ?? 999) +
              (team.roundThree ?? 999) +
              (team.roundTwo ?? 999) +
              (team.roundOne ?? 999),
        ).length > 1
          ? "T"
          : "") +
          (tourTeams.filter(
            (a) =>
              (a.roundFour ?? 999) +
                (a.roundThree ?? 999) +
                (a.roundTwo ?? 999) +
                (a.roundOne ?? 999) <
              (team.roundFour ?? 999) +
                (team.roundThree ?? 999) +
                (team.roundTwo ?? 999) +
                (team.roundOne ?? 999),
          ).length +
            1)}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
          Math.round(
            ((team.roundFour ?? 999) -
              teams.reduce((p, c) => (p += c.roundFour ?? 999), 0) /
                teams.length) *
              10,
          ) /
            10 <
            0
            ? "bg-green-50 text-green-900"
            : "bg-red-50 text-red-900",
        )}
      >
        {formatScore(
          Math.round(
            ((team.roundFour ?? 999) -
              teams.reduce((p, c) => (p += c.roundFour ?? 999), 0) /
                teams.length) *
              10,
          ) / 10,
        )}
      </TableCell>
    </TableRow>
  );
}
