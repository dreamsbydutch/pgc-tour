import { Course, Tier, Tournament } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import { cn } from "@/lib/utils/core";

export function LeagueSchedule({
  tournaments,
}: {
  tournaments: (Tournament & { tier: Tier; course: Course })[];
}) {
  // Get tournament status using the extracted function
  const { currentTournamentIndex, betweenTournamentsIndex } =
    getTournamentStatus(tournaments);

  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
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
          {tournaments.map((tourney, i) => {
            // Determine if this tournament is current (within the specified range)
            const isCurrent = i === currentTournamentIndex;

            // Determine if we should show a border after this tournament
            const showBorderAfter = betweenTournamentsIndex === i;

            return (
              <TableRow
                key={tourney.id}
                className={cn(
                  tournaments[i - 1]?.tier.name !== "Playoff" &&
                    tournaments[i]?.tier.name === "Playoff" &&
                    "border-t-2 border-t-slate-500",
                  tournaments[i]?.tier.name === "Playoff" && "bg-yellow-50",
                  tournaments[i]?.seasonId !== tournaments[i - 1]?.seasonId &&
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
                      {tourney.name}
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
                  {tourney.tier?.name}
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "min-w-48 border-l text-center text-xs",
                  )}
                >
                  {tourney.course?.name}
                </TableCell>
                <TableCell
                  className={cn(
                    isCurrent && "font-bold",
                    "min-w-32 border-l text-center text-xs",
                  )}
                >
                  {tourney.course?.location}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
function getTournamentStatus(
  tournaments: (Tournament & { tier: Tier; course: Course })[],
) {
  const today = new Date();

  // Find current tournament within the specified range (3 days before to 1 day after)
  const currentTournamentIndex = tournaments.findIndex((tourney) => {
    const threeDaysPrior = new Date(tourney.startDate);
    threeDaysPrior.setDate(threeDaysPrior.getDate() - 3);

    const oneDayAfter = new Date(tourney.endDate);
    oneDayAfter.setDate(oneDayAfter.getDate() + 1);

    return today >= threeDaysPrior && today <= oneDayAfter;
  });

  // If no current tournament, find where we are between tournaments
  let betweenTournamentsIndex = -1;
  if (currentTournamentIndex === -1) {
    betweenTournamentsIndex = tournaments.findIndex((tourney, i) => {
      const nextTourney = tournaments[i + 1];
      if (!nextTourney) return false;

      const currentEndDate = new Date(tourney.endDate);
      currentEndDate.setDate(currentEndDate.getDate() + 1); // 1 day after end

      const nextStartDate = new Date(nextTourney.startDate);
      nextStartDate.setDate(nextStartDate.getDate() - 3); // 3 days before start

      return today > currentEndDate && today < nextStartDate;
    });
  }

  return {
    currentTournamentIndex,
    betweenTournamentsIndex,
  };
}
