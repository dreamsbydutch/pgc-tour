import Image from "next/image";
import { capitalize, cn, getTournamentTimeline } from "@pgc-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  SVGSkeleton,
} from "src/lib/components/functional/ui";

/**
 * LeagueSchedule Component
 *
 * Displays a table of all league tournaments, including their logos, dates, tier, course, and location.
 * Highlights the current tournament and visually separates playoffs and new seasons.
 *
 * @param tournaments - Array of tournament objects to display in the schedule
 *   - id: string
 *   - name: string
 *   - logoUrl: string | null
 *   - startDate: string (ISO date string)
 *   - endDate: string (ISO date string)
 *   - seasonId: string
 *   - tier: { name: string }
 *   - course: { name: string; location: string }
 */
export function LeagueSchedule({
  tournaments,
}: {
  /**
   * Array of tournament objects to display
   */
  tournaments: {
    id: string;
    name: string;
    logoUrl: string | null;
    startDate: Date;
    endDate: Date;
    seasonId: string;
    tier: { name: string };
    course: { name: string; location: string };
  }[];
}) {
  // Get timeline info (all, current, past, etc.)
  const timeline = getTournamentTimeline(tournaments);
  const sortedTournaments = timeline.all;
  // Index of the current tournament in the sorted list
  const currentTournamentIndex = timeline.current
    ? sortedTournaments.findIndex((t) => t.id === timeline.current?.id)
    : -1;
  // Index of the most recent past tournament
  const previousTournamentIndex = timeline.past.slice(-1)[0]
    ? sortedTournaments.findIndex(
        (t) => t.id === timeline.past.slice(-1)[0]?.id,
      )
    : -1;

  // Show skeleton if no tournaments
  if (!sortedTournaments || sortedTournaments.length === 0)
    return <LeagueScheduleSkeleton />;
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
            <TableHead className="p-1 text-center text-xs font-bold">
              Tournament
            </TableHead>
            <TableHead className="border-l p-1 text-center text-xs font-bold">
              Dates
            </TableHead>
            <TableHead className="border-l p-1 text-center text-xs font-bold">
              Tier
            </TableHead>
            <TableHead className="border-l p-1 text-center text-xs font-bold">
              Course
            </TableHead>
            <TableHead className="border-l p-1 text-center text-xs font-bold">
              Location
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTournaments.map((tourney, i) => {
            // Highlight current tournament row
            const isCurrent = i === currentTournamentIndex;
            // Show a border after the last completed tournament if no current
            const showBorderAfter =
              i === previousTournamentIndex && currentTournamentIndex === -1;

            return (
              <TableRow
                key={tourney.id}
                className={cn(
                  // Add border before playoffs
                  sortedTournaments[i - 1]?.tier.name !== "Playoff" &&
                    sortedTournaments[i]?.tier.name === "Playoff" &&
                    "border-t-2 border-t-slate-500",
                  // Highlight playoff rows
                  sortedTournaments[i]?.tier.name === "Playoff" &&
                    "bg-yellow-50",
                  // Add thick border for new season
                  sortedTournaments[i]?.seasonId !==
                    sortedTournaments[i - 1]?.seasonId &&
                    i !== 0 &&
                    "border-t-4 border-t-slate-800",
                  // Highlight major tournaments
                  tourney.tier.name === "Major" && "bg-blue-50",
                  // Dashed border after last completed tournament
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

/**
 * LeagueScheduleSkeleton Component
 *
 * Displays a loading skeleton that mimics the LeagueSchedule table layout.
 * Uses shimmer/animated placeholders for a better loading experience.
 *
 * @param rows - Number of skeleton rows to display (default: 16)
 */
function LeagueScheduleSkeleton({ rows = 16 }: { rows?: number }) {
  return (
    <div className="-lg m-1 animate-pulse border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <SVGSkeleton className="-full h-14 w-14" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-x-auto">
          <table className="w-full font-varela">
            <thead>
              <tr>
                <th className="span text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-20" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-16" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-12" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-16" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="min-w-48 text-xs">
                    <div className="flex items-center justify-evenly gap-1 text-center">
                      <SVGSkeleton className="h-8 w-8 object-contain" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-20" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-12" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-16" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
