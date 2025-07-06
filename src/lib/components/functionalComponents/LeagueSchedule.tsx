import { Course, Tier, Tournament } from "@prisma/client";
import Image from "next/image";
import { cn } from "@/lib/utils/core";
import { getTournamentTimeline } from "@/lib/utils/domain/dates";
import { isNonEmptyArray } from "@/lib/utils/core/types";
import { capitalize } from "@/lib/utils/core/primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// Use Pick/Omit on Prisma types for strict minimal types

type MinimalTournament = Pick<
  Tournament,
  "id" | "name" | "logoUrl" | "startDate" | "endDate" | "seasonId"
> & {
  tier: Pick<Tier, "name">;
  course: Pick<Course, "name" | "location">;
};

export function LeagueSchedule({
  tournaments,
}: {
  tournaments: MinimalTournament[];
}) {
  const timeline = getTournamentTimeline(tournaments);
  const sortedTournaments = timeline.allSorted;
  const currentTournamentIndex = timeline.current
    ? sortedTournaments.findIndex((t) => t.id === timeline.current?.id)
    : -1;
  const previousTournamentIndex = timeline.past.slice(-1)[0]
    ? sortedTournaments.findIndex(
        (t) => t.id === timeline.past.slice(-1)[0]?.id,
      )
    : -1;

  if (!isNonEmptyArray(sortedTournaments)) return null;
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <Image
          src={"/logo512.png"}
          alt="PGC Logo"
          width={512}
          height={512}
          className="h-14 w-14 object-contain"
        />
        <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
          Schedule
        </h2>
      </div>
      <Table className="mx-auto font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="span text-center text-xs font-bold">
              Tournament
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Dates
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Tier
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Course
            </TableHead>
            <TableHead className="border-l text-center text-xs font-bold">
              Location
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTournaments.map((tourney, i) => {
            const isCurrent = i === currentTournamentIndex;
            const showBorderAfter =
              i === previousTournamentIndex && currentTournamentIndex === -1;

            return (
              <TableRow
                key={tourney.id}
                className={cn(
                  sortedTournaments[i - 1]?.tier.name !== "Playoff" &&
                    sortedTournaments[i]?.tier.name === "Playoff" &&
                    "border-t-2 border-t-slate-500",
                  sortedTournaments[i]?.tier.name === "Playoff" &&
                    "bg-yellow-50",
                  sortedTournaments[i]?.seasonId !==
                    sortedTournaments[i - 1]?.seasonId &&
                    i !== 0 &&
                    "border-t-4 border-t-slate-800",
                  tourney.tier.name === "Major" && "bg-blue-50",
                  showBorderAfter &&
                    "border-b-[3px] border-dashed border-b-blue-800",
                )}
              >
                <TableCell className="min-w-48 text-xs">
                  <div className="flex items-center justify-evenly gap-1 text-center">
                    <Image
                      src={tourney.logoUrl ?? ""}
                      className={cn(
                        isCurrent ? "h-12 w-12" : "h-8 w-8",
                        "object-contain",
                      )}
                      alt={tourney.name}
                      width={128}
                      height={128}
                    />
                    <span className={cn(isCurrent && "font-bold")}>
                      {capitalize(tourney.name)}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "text-nowrap border-l text-center text-xs",
                  )}
                >
                  {`${tourney.startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })} - ${
                    tourney.startDate.getMonth() === tourney.endDate.getMonth()
                      ? tourney.endDate.toLocaleDateString("en-US", {
                          day: "numeric",
                        })
                      : tourney.endDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                  }`}
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "text-nowrap border-l text-center text-xs",
                  )}
                >
                  {capitalize(tourney.tier?.name ?? "")}
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "min-w-48 border-l text-center text-xs",
                  )}
                >
                  {capitalize(tourney.course?.name ?? "")}
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "min-w-32 border-l text-center text-xs",
                  )}
                >
                  {capitalize(tourney.course?.location ?? "")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
