"use client";

/**
 * LeaderboardListing component - Individual row in the leaderboard
 */

import React, { useState, useCallback } from "react";
import { formatScore } from "@pgc-utils";
import {
  getLeaderboardRowClass,
  getPositionChange,
  isPlayerCut,
} from "../utils";
import { ScoreDisplay } from "./ScoreDisplay";
import { PGADropdown, TeamGolfersTable } from "./TableComponents";
import type {
  LeaderboardTournament,
  LeaderboardGolfer,
  LeaderboardTeam,
  LeaderboardTourCard,
  LeaderboardMember,
} from "../utils/types";
import { PositionChange } from "./UIComponents";

type LeaderboardListingProps =
  | {
      type: "PGC";
      tournament: LeaderboardTournament;
      tournamentGolfers: LeaderboardGolfer[];
      userTourCard: { id: string };
      team: LeaderboardTeam;
      tourCard: LeaderboardTourCard;
      member: LeaderboardMember;
    }
  | {
      type: "PGA";
      tournament: LeaderboardTournament;
      tournamentGolfers: LeaderboardGolfer[];
      userTourCard: { id: string };
      golfer: LeaderboardGolfer;
    };

export const LeaderboardListing: React.FC<LeaderboardListingProps> = (
  props,
) => {
  const { type, tournamentGolfers, userTourCard, tournament } = props;

  const team = type === "PGC" ? props.team : undefined;
  const golfer = type === "PGA" ? props.golfer : undefined;
  const tourCard = type === "PGC" ? props.tourCard : undefined;
  const member = type === "PGC" ? props.member : undefined;

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (!team && !golfer) return null;

  const posChange = getPositionChange(team, golfer, type);
  const shouldShowPositionChange =
    (props.tournament?.currentRound ?? 0) > 1 &&
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
        <div className="col-span-2 flex place-self-center font-varela text-base sm:col-span-5">
          {type === "PGA" ? golfer?.position : team?.position}
          {shouldShowPositionChange && <PositionChange posChange={posChange} />}
        </div>

        <div className="col-span-4 place-self-center font-varela text-lg sm:col-span-10">
          {type === "PGA" ? golfer?.playerName : tourCard?.displayName}
        </div>

        <div className="col-span-2 place-self-center font-varela text-base sm:col-span-5">
          {type !== "PGA" && team?.position === "CUT"
            ? "-"
            : formatScore((type === "PGA" ? golfer?.score : team?.score) ?? 0)}
        </div>

        {type === "PGA" ? (
          <ScoreDisplay
            type="PGA"
            golfer={golfer!}
            tournamentComplete={(tournament.round ?? 0) > 4}
          />
        ) : (
          <ScoreDisplay
            type="PGC"
            team={team!}
            tournamentComplete={(tournament.round ?? 0) > 4}
          />
        )}
      </div>

      {isOpen && (
        <div className="col-span-10 mx-auto mb-2 w-full max-w-4xl rounded-md border border-gray-300 bg-white shadow-md">
          {type === "PGA" ? (
            <PGADropdown golfer={golfer!} userTeam={team} />
          ) : (
            <TeamGolfersTable team={team!} teamGolfers={tournamentGolfers} />
          )}
        </div>
      )}
    </div>
  );
};
