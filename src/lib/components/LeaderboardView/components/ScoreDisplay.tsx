/**
 * Score display component for LeaderboardView
 */

import React from "react";
import { formatScore, formatMoney, getGolferTeeTime } from "@utils/main";
import { isPlayerCut } from "../utils";

// Simple cell component to reduce repetition
const ScoreCell: React.FC<{
  value: string | number | null | undefined;
  colSpan?: number;
  className?: string;
  hidden?: boolean;
}> = ({ value, colSpan = 1, className = "", hidden = false }) => (
  <div
    className={`col-span-${colSpan} place-self-center font-varela text-sm ${className} ${hidden ? "hidden sm:flex" : ""}`}
  >
    {value ?? "-"}
  </div>
);

type TeamData = {
  position: string | null;
  today: number;
  thru: number;
  round?: number | null;
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
  roundThreeTeeTime?: string | null;
  roundFourTeeTime?: string | null;
  points: number;
  earnings: number;
};

type GolferData = {
  position: string | null;
  group: number;
  rating: number | null;
  today: number;
  thru: number;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  endHole: number;
  round?: number | null;
  roundOneTeeTime?: string | null;
  roundTwoTeeTime?: string | null;
  roundThreeTeeTime?: string | null;
  roundFourTeeTime?: string | null;
};
export const ScoreDisplay: React.FC<
  | {
      type: "PGC";
      team: TeamData;
    }
  | {
      type: "PGA";
      golfer: GolferData;
    }
> = (props) => {
  const { type } = props;

  const team = type === "PGC" ? props.team : undefined;
  const golfer = type === "PGA" ? props.golfer : undefined;

  const isPlayerCutOrWithdrawn =
    isPlayerCut(team?.position ?? null) ||
    isPlayerCut(golfer?.position ?? null);
  const isTournamentOver = team?.round === 5 || golfer?.round === 5;

  if (isPlayerCutOrWithdrawn) {
    return (
      <>
        <ScoreCell value="-" />
        <ScoreCell value="-" />
        <ScoreCell value={golfer?.roundOne} hidden />
        <ScoreCell value={golfer?.roundTwo} hidden />
        <ScoreCell value={golfer?.roundThree} hidden />
        <ScoreCell value={golfer?.roundFour} hidden />
      </>
    );
  }

  if (isTournamentOver) {
    const firstCellValue =
      type === "PGA"
        ? golfer?.group === 0
          ? "-"
          : golfer?.group
        : team?.points === 0
          ? "-"
          : team?.points;

    const secondCellValue =
      type === "PGA"
        ? golfer?.rating
        : formatMoney(+(team?.earnings ?? 0), true);

    return (
      <>
        <ScoreCell value={firstCellValue} />
        <ScoreCell value={secondCellValue} className="whitespace-nowrap" />
        <ScoreCell value={type === "PGA" ? golfer?.roundOne : "-"} hidden />
        <ScoreCell value={type === "PGA" ? golfer?.roundTwo : "-"} hidden />
        <ScoreCell value={type === "PGA" ? golfer?.roundThree : "-"} hidden />
        <ScoreCell value={type === "PGA" ? golfer?.roundFour : "-"} hidden />
      </>
    );
  }

  if (type === "PGA") {
    return renderPGAScores(props.golfer);
  }

  if (type === "PGC") {
    return renderPGCScores(props.team);
  }

  return renderFallbackScores(team);
};

const renderPGAScores = (golfer: GolferData) => {
  if (!golfer.thru || golfer.thru === 0) {
    return (
      <>
        <div className="col-span-2 place-self-center font-varela text-xs">
          {getGolferTeeTime(golfer)}
          {golfer.endHole === 9 ? "*" : ""}
        </div>
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
      <ScoreCell value={golfer.roundOne} hidden />
      <ScoreCell value={golfer.roundTwo} hidden />
      <ScoreCell value={golfer.roundThree} hidden />
      <ScoreCell value={golfer.roundFour} hidden />
    </>
  );
};

const renderPGCScores = (team: TeamData) => {
  if (!team.thru || team.thru === 0) {
    return (
      <>
        <div className="col-span-2 place-self-center font-varela text-xs">
          {getGolferTeeTime(team)}
        </div>
        <ScoreCell value="-" hidden />
        <ScoreCell value="-" hidden />
        <ScoreCell value="-" hidden />
        <ScoreCell value="-" hidden />
      </>
    );
  }

  return (
    <>
      <ScoreCell value={formatScore(team.today)} />
      <ScoreCell value={team.thru === 18 ? "F" : team.thru} />
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
    </>
  );
};

const renderFallbackScores = (team?: TeamData) => {
  const thruValue =
    team?.round === 5
      ? "-"
      : team?.round === 4
        ? "F"
        : team?.thru === 18
          ? "F"
          : team?.thru;

  return (
    <>
      <div className="col-span-2 place-self-center font-varela text-xs">
        {thruValue}
      </div>
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
      <ScoreCell value="-" hidden />
    </>
  );
};
