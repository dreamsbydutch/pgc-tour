/**
 * Utility functions for LeaderboardView
 */

import { type ReactElement } from "react";
import { sortMultiple, filterItems } from "@pgc-utils";
import { COUNTRY_FLAG_DATA, SCORE_PENALTIES } from "./constants";

// ================= FORMATTING & DISPLAY =================

export const getCountryFlag = (code: string | null): ReactElement | undefined =>
  COUNTRY_FLAG_DATA.find((item) => item.key === code)?.image();

export const calculateScoreForSorting = (
  position: string | null,
  score: number | null,
): number => {
  if (position === "DQ") return SCORE_PENALTIES.DQ + (score ?? 999);
  if (position === "WD") return SCORE_PENALTIES.WD + (score ?? 999);
  if (position === "CUT") return SCORE_PENALTIES.CUT + (score ?? 999);
  return score ?? 999;
};

export const getPositionChange = (
  team: { pastPosition: string | null; position: string | null } | undefined,
  golfer: { posChange: number | null } | undefined,
  type: "PGC" | "PGA",
): number => {
  if (type === "PGA") return golfer?.posChange ?? 0;
  if (!team?.pastPosition || !team?.position) return 0;
  return +team.pastPosition.replace("T", "") - +team.position.replace("T", "");
};

export const isPlayerCut = (position: string | null): boolean =>
  ["CUT", "WD", "DQ"].includes(position ?? "");

export const formatRounds = (golfer: {
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
}): string =>
  [golfer.roundOne, golfer.roundTwo, golfer.roundThree, golfer.roundFour]
    .filter(Boolean)
    .join(" / ");

export const formatPercentageDisplay = (value: number | null): string =>
  value ? `${Math.round(value * 1000) / 10}%` : "-";

// ================= SORTING =================

export const sortTeams = (
  teams: {
    thru: number | null;
    position: string | null;
    score: number | null;
  }[],
) =>
  teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
      (a, b) =>
        calculateScoreForSorting(a.position, a.score) -
        calculateScoreForSorting(b.position, b.score),
    );

export const sortGolfers = (
  golfers: {
    id?: number;
    position: string;
    score: number;
    group: number | null;
  }[],
) => {
  // Separate cut and non-cut golfers
  const nonCutGolfers = golfers.filter((g) => !isPlayerCut(g.position));
  const cutGolfers = golfers.filter((g) => isPlayerCut(g.position));

  // Sort non-cut golfers by score
  nonCutGolfers.sort(
    (a, b) =>
      calculateScoreForSorting(a.position, a.score) -
      calculateScoreForSorting(b.position, b.score),
  );

  // Sort cut golfers by group
  cutGolfers
    .sort(
      (a, b) =>
        calculateScoreForSorting(a.position, a.score) -
        calculateScoreForSorting(b.position, b.score),
    )
    .sort((a, b) => (a.group ?? 999) - (b.group ?? 999))
    .sort((a, b) => a.position.localeCompare(b.position));

  // Concatenate non-cut golfers first, then cut golfers
  return [...nonCutGolfers, ...cutGolfers];
};

export const getSortedTeamGolfers = (
  team: { golferIds: number[] },
  teamGolfers: {
    id: number;
    apiId: number;
    today: number | null;
    thru: number | null;
    score: number | null;
    group: number | null;
  }[] = [],
) =>
  sortMultiple(
    filterItems(teamGolfers, { apiId: team.golferIds }),
    ["today", "thru", "score", "group"],
    ["asc", "asc", "asc", "asc"],
  );

// ================= STYLING =================

export const getGolferRowClass = (
  team: { round: number | null },
  golfer: { position: string | null },
  i: number,
): string => {
  const classes = [];

  if ((team.round ?? 0) >= 3 && i === 4)
    classes.push("border-b border-gray-700");
  if (i === 9) classes.push("border-b border-gray-700");
  if (isPlayerCut(golfer.position)) classes.push("text-gray-400");

  return classes.join(" ");
};

export const getLeaderboardRowClass = (
  type: "PGC" | "PGA",
  team: { position: string | null; golferIds: number[] } | undefined,
  golfer: { apiId: number; position: string | null } | undefined,
  tourCard: { id: string; memberId: string } | null | undefined,
  userTourCard: { id: string } | null | undefined,
  member: { friends: string[] | null } | null | undefined,
): string => {
  const classes = [
    "col-span-10 grid grid-flow-row grid-cols-10 py-0.5 sm:grid-cols-33",
  ];

  if (type === "PGC") {
    if (tourCard?.id === userTourCard?.id)
      classes.push("bg-slate-200 font-semibold");
    if (member?.friends?.includes(tourCard?.memberId ?? ""))
      classes.push("bg-slate-100");
    if (team?.position === "CUT") classes.push("text-gray-400");
  }

  if (type === "PGA") {
    if (team?.golferIds?.includes(golfer?.apiId ?? 0))
      classes.push("bg-slate-100");
    if (isPlayerCut(golfer?.position ?? null)) classes.push("text-gray-400");
  }

  return classes.join(" ");
};
