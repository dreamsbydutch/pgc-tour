"use client";

import { useEffect, useState } from "react";
import { type Tournament } from "@prisma/client";
import { TournamentLogo } from "@/src/app/_components/OptimizedImage";
import { useMainStore } from "@/src/lib/store/store";

/**
 * TournamentCountdown Component
 *
 * Displays a countdown timer for an upcoming tournament.
 * - If the tournament has already started, nothing is rendered.
 * - Otherwise, a countdown timer is displayed showing days, hours, minutes, and seconds.
 *
 * Props:
 * - tourney: The tournament object containing details like name, start date, and logo URL.
 */
export default function TournamentCountdown({
  inputTourney,
}: {
  inputTourney?: Tournament | undefined;
}) {
  const nextTourney = useMainStore((state) => state.nextTournament);
  let tourney: Tournament | null = null;
  if (!inputTourney) {
    tourney = nextTourney;
  } else {
    tourney = inputTourney;
  }
  const timer = calculateTimeLeft(tourney?.startDate ?? new Date());

  // If the countdown has reached zero, render nothing
  if (
    (timer.days === 0 &&
      timer.hours === 0 &&
      timer.minutes === 0 &&
      timer.seconds === 0) ||
    !tourney
  ) {
    return <TournamentCountdownSkeleton />;
  }

  return (
    <CountdownTimer tourney={tourney} startDateTime={tourney?.startDate} />
  );
}

/**
 * twoDigits Utility Function
 *
 * Pads a number with leading zeros to ensure it has at least two digits.
 *
 * @param num - The number to pad.
 * @returns A string representation of the number with at least two digits.
 */
export const twoDigits = (num: number) => String(num).padStart(2, "0");

/**
 * CountdownTimer Component
 *
 * Displays the countdown timer for a tournament.
 * - Updates every second using a `setInterval`.
 * - Cleans up the interval when the component unmounts.
 *
 * Props:
 * - tourney: The tournament object containing details like name and logo URL.
 * - startDateTime: The start date and time of the tournament.
 */
const CountdownTimer = ({
  tourney,
  startDateTime,
}: {
  tourney: Tournament;
  startDateTime: Date;
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeftType>(
    calculateTimeLeft(startDateTime),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(startDateTime));
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, [startDateTime]);

  return (
    <div className="mx-auto my-4 w-11/12 max-w-3xl rounded-2xl bg-gray-100 p-2 shadow-md md:w-10/12 lg:w-7/12">
      <div className="text-center">
        <h1 className="px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          Countdown until {tourney?.name}
        </h1>
        <div className="my-4 flex w-full items-center justify-center gap-4">
          <TournamentLogo
            className="h-32 w-32 md:h-40 md:w-40"
            alt="Tourney Logo"
            src={tourney?.logoUrl ?? ""}
            size="2xl"
          />
          <div className="font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
            {twoDigits(timeLeft.days)}:{twoDigits(timeLeft.hours)}:
            {twoDigits(timeLeft.minutes)}:{twoDigits(timeLeft.seconds)}
            <div className="text-2xs md:text-xs">Days : Hrs : Mins : Secs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * calculateTimeLeft Utility Function
 *
 * Calculates the time left until a given start date and time.
 * - If the start date has passed, all values are set to zero.
 *
 * @param startDateTime - The start date and time to calculate the difference from.
 * @returns An object containing the time left in days, hours, minutes, and seconds.
 */
const calculateTimeLeft = (startDateTime: Date) => {
  const difference = +new Date(startDateTime) - +new Date();
  let timeLeft: TimeLeftType;

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  } else {
    timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return timeLeft;
};

/**
 * TimeLeftType
 *
 * Represents the structure of the time left until the tournament starts.
 * - days: The number of days left.
 * - hours: The number of hours left.
 * - minutes: The number of minutes left.
 * - seconds: The number of seconds left.
 */
type TimeLeftType = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function TournamentCountdownSkeleton() {
  return (
    <div className="mx-auto my-4 w-11/12 max-w-3xl rounded-2xl bg-gray-100 p-2 shadow-md md:w-10/12 lg:w-7/12">
      <div className="flex flex-col items-center justify-center gap-1 px-3">
        <div className="h-8 w-5/6 max-w-lg animate-pulse rounded-lg bg-slate-200"></div>
        <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-lg bg-slate-200"></div>
      </div>
      <div className="my-3 flex items-center justify-center gap-1">
        <div className="h-28 w-28 animate-pulse rounded-lg bg-slate-200"></div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row gap-1">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
          </div>
          <div className="flex flex-row justify-center gap-1">
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
