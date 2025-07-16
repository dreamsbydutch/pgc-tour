/**
 * Score display component for LeaderboardView
 */

import React from "react";
import { formatScore, formatMoney, getGolferTeeTime } from "@pgc-utils";
import { isPlayerCut } from "../utils";
import type { LeaderboardTeam, LeaderboardGolfer } from "../utils/types";

// Simple cell component to reduce repetition
const ScoreCell: React.FC<{
  value: string | number | null | undefined;
  colSpan?: number;
  className?: string;
  hidden?: boolean;
}> = ({ value, colSpan = 1, className = "", hidden = false }) => (
  <div
    className={`col-span-${colSpan} place-self-center font-varela text-sm sm:col-span-2 ${className} ${hidden ? "hidden sm:flex" : ""}`}
  >
    {value ?? "-"}
  </div>
);

export const ScoreDisplay: React.FC<
  | { type: "PGC"; team: LeaderboardTeam; tournamentComplete: boolean }
  | { type: "PGA"; golfer: LeaderboardGolfer; tournamentComplete: boolean }
> = (props) => {
  const { type, tournamentComplete } = props;
  const listItem = type === "PGA" ? props.golfer : props.team;

  const isPlayerCutOrWithdrawn = isPlayerCut(listItem.position ?? null);

  // Cut/Withdrawn players
  if (isPlayerCutOrWithdrawn) {
    return (
      <>
        <ScoreCell
          value={
            type === "PGA"
              ? props.golfer.group === 0
                ? "-"
                : props.golfer.group
              : "-"
          }
        />
        <ScoreCell value={type === "PGA" ? props.golfer.rating : "-"} />
        <div className="col-span-1 hidden sm:flex"></div>
        <ScoreCell value={listItem.roundOne} hidden />
        <ScoreCell value={listItem.roundTwo} hidden />
        <ScoreCell value={listItem.roundThree} hidden />
        <ScoreCell value={listItem.roundFour} hidden />
      </>
    );
  }

  // Tournament finished
  if (tournamentComplete) {
    const firstValue =
      type === "PGA"
        ? props.golfer?.group === 0
          ? "-"
          : props.golfer?.group
        : props.team?.points === 0
          ? "-"
          : props.team?.points;

    const secondValue =
      type === "PGA"
        ? props.golfer?.rating
        : formatMoney(+(props.team?.earnings ?? 0), true);

    return (
      <>
        <ScoreCell value={firstValue} />
        <ScoreCell value={secondValue} className="whitespace-nowrap" />

        <div className="col-span-1 hidden sm:flex"></div>
        <ScoreCell value={listItem.roundOne} hidden />
        <ScoreCell value={listItem.roundTwo} hidden />
        <ScoreCell value={listItem.roundThree} hidden />
        <ScoreCell value={listItem.roundFour} hidden />
      </>
    );
  }

  // Active tournament
  if (type === "PGA") {
    return renderPGAScores(props.golfer);
  }
  return renderPGCScores(props.team);
};

const renderPGAScores = (golfer: LeaderboardGolfer) => {
  if (!golfer.thru || golfer.thru === 0) {
    return (
      <>
        <div className="col-span-4 place-self-center font-varela text-xs">
          {getGolferTeeTime(golfer)}
          {golfer.endHole === 9 ? "*" : ""}
        </div>

        <div className="col-span-1 hidden sm:flex"></div>
        <ScoreCell value={golfer.roundOne} hidden />
        <ScoreCell value={golfer.roundTwo} hidden />
        <ScoreCell value={golfer.roundThree} hidden />
        <ScoreCell value={golfer.roundFour} hidden />
      </>
    );
  }

  return (
    <>
      <ScoreCell
        value={golfer.today !== null ? formatScore(golfer.today) : "-"}
      />
      <ScoreCell value={golfer.thru === 18 ? "F" : golfer.thru} />

      <div className="col-span-1 hidden sm:flex"></div>
      <ScoreCell value={golfer.roundOne} hidden />
      <ScoreCell value={golfer.roundTwo} hidden />
      <ScoreCell value={golfer.roundThree} hidden />
      <ScoreCell value={golfer.roundFour} hidden />
    </>
  );
};

const renderPGCScores = (team: LeaderboardTeam) => {
  if (!team.thru || team.thru === 0) {
    return (
      <>
        <div className="col-span-4 place-self-center font-varela text-xs">
          {getGolferTeeTime(team)}
        </div>

        <div className="col-span-1 hidden sm:flex"></div>
        <ScoreCell value={team.roundOne} hidden />
        <ScoreCell value={team.roundTwo} hidden />
        <ScoreCell value={team.roundThree} hidden />
        <ScoreCell value={team.roundFour} hidden />
      </>
    );
  }

  return (
    <>
      <ScoreCell value={formatScore(team.today)} />
      <ScoreCell value={team.thru === 18 ? "F" : team.thru} />

      <div className="col-span-1 hidden sm:flex"></div>
      <ScoreCell value={team.roundOne} hidden />
      <ScoreCell value={team.roundTwo} hidden />
      <ScoreCell value={team.roundThree} hidden />
      <ScoreCell value={team.roundFour} hidden />
    </>
  );
};
