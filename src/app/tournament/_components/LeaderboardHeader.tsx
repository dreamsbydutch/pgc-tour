import Image from "next/image";
import HeaderDropdown from "./HeaderDropdownMenu";
import type { TournamentData } from "@/src/types/prisma_include";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "../../_components/ui/popover";
import { cn, fetchDataGolf, formatMoney, formatRank } from "@/src/lib/utils";
import type { DatagolfCourseInputData } from "@/src/types/datagolf_types";

export default async function LeaderboardHeader({
  focusTourney,
  seasonId,
}: {
  focusTourney: TournamentData;
  seasonId?: string;
}) {
  return (
    <div
      id={`leaderboard-header-${focusTourney.id}`}
      className="mx-auto w-full max-w-4xl md:w-11/12 lg:w-8/12"
    >
      <div className="mx-auto grid grid-flow-row grid-cols-10 items-center border-b-2 border-gray-800 py-2">
        <div className="col-span-3 row-span-4 max-h-40 place-self-center px-1 py-2 text-center font-varela">
          {focusTourney.logoUrl && (
            <Image
              src={focusTourney.logoUrl}
              className="max-h-36"
              alt={`${focusTourney.name} logo`}
              width={150}
              height={150}
            />
          )}
        </div>
        <div className="col-span-5 row-span-2 place-self-center text-center font-varela text-xl font-bold xs:text-2xl sm:text-3xl lg:text-4xl">
          {focusTourney.name}
        </div>

        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-xs xs:text-sm sm:text-base md:text-lg">
          <HeaderDropdown activeTourney={focusTourney} {...{ seasonId }} />
        </div>
        <div className="col-span-2 row-span-1 place-self-center text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${focusTourney.startDate.toLocaleDateString("en-us", {
            month: "short",
            day: "numeric",
          })} - ${
            focusTourney.startDate.getMonth() ===
            focusTourney.endDate.getMonth()
              ? focusTourney.endDate.toLocaleDateString("en-us", {
                  day: "numeric",
                })
              : focusTourney.endDate.toLocaleDateString("en-us", {
                  month: "short",
                  day: "numeric",
                })
          }`}
        </div>
        <Popover>
          <PopoverTrigger className="col-span-3 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {focusTourney.course.name}
          </PopoverTrigger>
          <PopoverContent>
            <CoursePopover {...{ focusTourney }} />
          </PopoverContent>
        </Popover>
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {focusTourney.course.location}
        </div>
        <div className="col-span-2 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
          {`${focusTourney.course.front} - ${focusTourney.course.back} - ${focusTourney.course.par}`}
        </div>
        <Popover>
          <PopoverTrigger className="col-span-7 row-span-1 text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
            {focusTourney.tier.name} Tournament -
            {` 1st Place: ${focusTourney.tier.points[0] ?? 0} pts, ${Intl.NumberFormat(
              "en-US",
              {
                style: "currency",
                currency: "USD",
              },
            ).format(focusTourney.tier.payouts[0] ?? 0)}`}
          </PopoverTrigger>
          <PopoverContent>
            <PointsAndPayoutsPopover {...{ focusTourney }} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function PointsAndPayoutsPopover({
  focusTourney,
}: {
  focusTourney: TournamentData;
}) {
  return (
    <div className="grid grid-cols-3 text-center">
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {focusTourney.tier.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {focusTourney.tier.payouts.slice(0, 35).map((a) => (
          <div key={"payout-" + a} className="text-xs">
            {formatMoney(a)}
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-fit flex-col">
        <div className="text-base font-semibold">Points</div>
        {focusTourney.tier.points.slice(0, 35).map((a) => (
          <div key={"points-" + a} className="text-xs">
            {a.toString()}
          </div>
        ))}
      </div>
    </div>
  );
}

async function CoursePopover({
  focusTourney,
}: {
  focusTourney: TournamentData;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const courseData: DatagolfCourseInputData = await fetchDataGolf(
    "preds/live-hole-stats",
    {},
  );
  if (!courseData) return <></>;
  return (
    <>
      {courseData.courses[0]?.rounds
        ?.find((a) => a.round_num === focusTourney.currentRound)
        ?.holes?.map((b, i) => {
          const holes = courseData.courses[0]?.rounds
            .map((c) => c.holes.find((d) => d.hole === b.hole)?.total.avg_score)
            .flat();
          const averageScore =
            (holes?.reduce((p, c) => (p ?? 0) + (c ?? 0), 0) ?? 0) /
            (holes?.length ?? 1);
          return (
            <div
              key={i}
              className="grid grid-cols-4 border-slate-800 py-0.5 text-center [&:nth-child(9)]:border-b"
            >
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{formatRank(b.hole)} Hole</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{b.yardage} yards</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">Par {b.par}</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div
                  className={cn(
                    "text-xs",
                    averageScore - b.par > 0
                      ? "text-red-900"
                      : averageScore - b.par < 0
                        ? "text-green-900"
                        : "",
                  )}
                >
                  {averageScore - b.par === 0
                    ? "E"
                    : (averageScore - b.par > 0 ? "+" : "") +
                      Math.round((averageScore - b.par) * 1000) / 1000}
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
}
