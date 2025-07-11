/**
 * LeaderboardListing component - Individual row in the leaderboard
 */

import React, { useState, useCallback } from "react";
import { formatScore } from "@utils/main";
import {
  getPositionChange,
  isPlayerCut,
  getLeaderboardRowClass,
} from "../utils";
import { PositionChange } from "./UIComponents";
import { ScoreDisplay } from "./ScoreDisplay";
import { PGADropdown, TeamGolfersTable } from "./TableComponents";
import type { LeaderboardListingProps } from "../types";

export const LeaderboardListing: React.FC<LeaderboardListingProps> = ({
  type,
  tournament,
  tournamentGolfers,
  userTourCard,
  golfer,
  team,
  tourCard,
  course,
  member,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (!team && !golfer) return null;

  const posChange = getPositionChange(team, golfer, type);
  const shouldShowPositionChange =
    (tournament?.currentRound ?? 0) > 1 &&
    !isPlayerCut(team?.position ?? null) &&
    !isPlayerCut(golfer?.position ?? null);

  const rowClass = getLeaderboardRowClass(
    type,
    team,
    golfer,
    tourCard,
    userTourCard,
    member,
  );

  return (
    <div
      key={team?.id ?? golfer?.apiId}
      onClick={handleToggle}
      className="mx-auto my-0.5 grid max-w-4xl cursor-pointer grid-flow-row grid-cols-10 rounded-md text-center"
    >
      <div className={rowClass}>
        <div className="col-span-2 flex place-self-center font-varela text-base sm:col-span-3">
          {type === "PGA" ? golfer?.position : team?.position}
          {shouldShowPositionChange && <PositionChange posChange={posChange} />}
        </div>

        <div className="col-span-4 place-self-center font-varela text-lg">
          {type === "PGA" ? golfer?.playerName : tourCard?.displayName}
        </div>

        <div className="col-span-2 place-self-center font-varela text-base">
          {type !== "PGA" && team?.position === "CUT"
            ? "-"
            : formatScore((type === "PGA" ? golfer?.score : team?.score) ?? 0)}
        </div>

        <ScoreDisplay type={type} team={team} golfer={golfer} course={course} />
      </div>

      {isOpen && (
        <div className="col-span-10 mx-auto mb-2 w-full max-w-4xl rounded-md border border-gray-300 bg-white shadow-md">
          {type === "PGA" ? (
            <PGADropdown golfer={golfer!} userTeam={team} />
          ) : (
            <TeamGolfersTable
              team={team!}
              teamGolfers={tournamentGolfers}
              course={course}
            />
          )}
        </div>
      )}
    </div>
  );
};
