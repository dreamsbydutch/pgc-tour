/**
 * LeaderboardHeader - Header row for the leaderboard
 */

import React from "react";

interface LeaderboardHeaderProps {
  tournamentOver: boolean;
  activeTour: string;
}

export const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
  tournamentOver,
  activeTour,
}) => (
  <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center sm:grid-cols-16">
    <div className="col-span-2 place-self-center font-varela text-sm font-bold sm:col-span-3">
      Rank
    </div>
    <div className="col-span-4 place-self-center font-varela text-base font-bold">
      Name
    </div>
    <div className="col-span-2 place-self-center font-varela text-sm font-bold">
      Score
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Group" : "Points") : "Today"}
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Rating" : "Earnings") : "Thru"}
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R1
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R2
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R3
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R4
    </div>
  </div>
);
