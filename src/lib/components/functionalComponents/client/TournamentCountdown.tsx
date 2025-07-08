"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Tournament } from "@prisma/client";
import { TournamentCountdownSkeleton } from "../loading/TournamentCountdownSkeleton";

/**
 * TournamentCountdown Component
 *
 * Presentational component that displays the countdown timer for a tournament.
 * - Receives tournament details and start time as props.
 * - Updates the countdown timer every second.
 *
 * Props:
 * - tourney: The tournament object containing details like name and logo URL.
 * - startDateTime: The start date and time of the tournament.
 */
export function TournamentCountdown({
  tourney,
}: {
  tourney: Pick<Tournament, "name" | "logoUrl" | "startDate">;
}) {
  const [isClient, setIsClient] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null); // Don't calculate initially

  useEffect(() => {
    setIsClient(true);
    // Set initial time when component mounts on client
    setTimeLeft(calculateTimeLeft(tourney.startDate));
  }, [tourney.startDate]);

  useEffect(() => {
    if (!isClient || !timeLeft) return;

    // Update the time left every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(tourney.startDate));
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, [isClient, tourney.startDate]);

  if (!isClient) {
    return <TournamentCountdownSkeleton />;
  }

  return (
    <div className="mx-auto my-4 w-11/12 max-w-3xl rounded-2xl bg-gray-100 p-2 shadow-md md:w-10/12 lg:w-7/12">
      <div className="text-center">
        <h1 className="px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          Countdown until {tourney.name}
        </h1>
        <div className="flex w-full items-center justify-center pb-3">
          <div>
            <Image
              className="max-h-32 w-full md:max-h-40"
              alt="Tourney Logo"
              src={tourney.logoUrl ?? ""}
              width={80}
              height={80}
            />
          </div>
          <div className="font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
            {twoDigits(timeLeft.days)}:{twoDigits(timeLeft.hours)}:
            {twoDigits(timeLeft.minutes)}:{twoDigits(timeLeft.seconds)}
            <div className="text-2xs md:text-xs">Days : Hrs : Mins : Secs</div>
          </div>
        </div>
      </div>
    </div>
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
