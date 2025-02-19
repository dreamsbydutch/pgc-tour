"use client";

import React, { useEffect, useState } from "react";
import { type Tournament } from "@prisma/client";
import Image from "next/image";

export default function TournamentCountdown({
  tourney,
}: {
  tourney: Tournament;
}) {
  const timer = calculateTimeLeft(tourney.startDate);
  if (
    timer.days === 0 &&
    timer.hours === 0 &&
    timer.minutes === 0 &&
    timer.seconds === 0
  ) {
    return <></>;
  }
  return <CountdownTimer tourney={tourney} startDateTime={tourney.startDate} />;
}

// https://stackoverflow.com/a/2998874/1673761
export const twoDigits = (num: number) => String(num).padStart(2, "0");

type TimeLeftType = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};
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
    <div
      className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-gray-100 p-2 shadow-md md:w-10/12 lg:w-7/12"
    >
      <div className="py-4 text-center">
        <h1 className="px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          Countdown until {tourney.name}
        </h1>
        <div className="flex w-full items-center justify-center py-3">
          <div className="">
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
};

const calculateTimeLeft = (startDateTime: Date) => {
  const difference = +new Date(startDateTime) - +new Date();
  let timeLeft = {};

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

  return timeLeft as TimeLeftType;
};
