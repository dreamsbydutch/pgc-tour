import { TournamentLogo } from "@/src/app/_components/OptimizedImage";
import HeaderDropdown from "./HeaderDropdownMenu";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "@/src/app/_components/ui/popover";
import { cn, fetchDataGolf, formatMoney, formatRank } from "@/src/lib/utils";
import type { DatagolfCourseInputData } from "@/src/lib/types/datagolf_types";
import type { Tier, Tournament } from "@prisma/client";
import { useMainStore } from "@/src/lib/store/store";

/**
 * LeaderboardHeader Component
 *
 * Displays the header for the leaderboard, including:
 * - Tournament name, logo, and date range.
 * - Course details and tier information.
 * - Dropdown for selecting tournaments and popovers for additional details.
 *
 * Props:
 * - focusTourney: The tournament data to display in the header.
 * - seasonId (optional): The current season ID.
 */
export default function LeaderboardHeader({
  focusTourney,
}: {
  focusTourney: Tournament;
}) {
  const course = useMainStore((state) => state.seasonTournaments)?.find(
    (t) => t.id === focusTourney.id,
  )?.course;
  const tier = useMainStore((state) => state.currentTiers)?.find(
    (t) => t.id === focusTourney.tierId,
  );
  return (
    <div
      id={`leaderboard-header-${focusTourney.id}`}
      className="mx-auto w-full max-w-4xl md:w-11/12 lg:w-8/12"
    >
      <div className="mx-auto grid grid-flow-row grid-cols-10 items-center border-b-2 border-gray-800 py-2">
        {" "}
        {/* Tournament Logo */}
        <div className="col-span-3 row-span-4 h-full w-full place-self-center p-2 text-center font-varela">
          {focusTourney.logoUrl && (
            <TournamentLogo
              src={focusTourney.logoUrl}
              className=""
              alt={`${focusTourney.name} logo`}
              size="xl"
              fill={true}
            />
          )}
        </div>
        {/* Tournament Name */}
        <div className="col-span-5 row-span-2 place-self-center text-center font-varela text-xl font-bold xs:text-2xl sm:text-3xl lg:text-4xl">
          {focusTourney.name}
        </div>
        {/* Tournament Dropdown */}
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-xs xs:text-sm sm:text-base md:text-lg">
          <HeaderDropdown activeTourney={focusTourney} />
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
            <CoursePopover {...{ focusTourney }} />
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
 *
 * Props:
 * - focusTourney: The tournament data containing course information.
 */
async function CoursePopover({ focusTourney }: { focusTourney: Tournament }) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const courseData: DatagolfCourseInputData = await fetchDataGolf(
    "preds/live-hole-stats",
    {},
  );

  if (!courseData) return null;

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
