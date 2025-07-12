/**
 * Team scoring calculation service
 */

import type { Team } from "@prisma/client";
import type { TeamWithGolfers, TournamentWithCourse } from "./types";
import { MIN_GOLFERS_FOR_CUT } from "./types";
import {
  determineCurrentRound,
  calculateRoundScores,
  calculateTotalScore,
  calculateTodayScore,
  calculateThru,
  isGolferCut,
} from "./scoring";
import { updateTeeTimes } from "./tee-times";
import { roundToOneDecimal } from "./utils";

/**
 * Calculates all scoring data for a team
 */
export function calculateTeamScoring(
  team: TeamWithGolfers,
  tournament: TournamentWithCourse,
): Team {
  const currentRound = determineCurrentRound(
    team.golfers,
    tournament.currentRound ?? 1,
  );
  const par = tournament.course.par ?? 72;
  const isLive = tournament.livePlay ?? false;

  const updatedTeam: Team = {
    ...team,
    round: currentRound,
  };

  // Update tee times
  updateTeeTimes(updatedTeam, team.golfers);

  // Calculate round scores
  const roundScores = calculateRoundScores(team.golfers, currentRound, par);
  Object.assign(updatedTeam, roundScores);

  // Check if team should be cut
  const activeGolfers = team.golfers.filter((g) => !isGolferCut(g));
  const shouldBeCut =
    currentRound > 2 && activeGolfers.length < MIN_GOLFERS_FOR_CUT;

  if (shouldBeCut) {
    return {
      ...updatedTeam,
      score: calculateTotalScore(roundScores, null, par),
      today: null,
      thru: null,
      position: "CUT",
      pastPosition: "CUT",
      roundThree: null,
      roundFour: null,
    };
  }

  // Calculate current scores
  const todayScore = calculateTodayScore(
    team.golfers,
    currentRound,
  );
  const totalScore = calculateTotalScore(roundScores, todayScore, par);

  return {
    ...updatedTeam,
    score: roundToOneDecimal(totalScore),
    today: roundToOneDecimal(todayScore),
    thru: calculateThru(team.golfers, currentRound, isLive),
  };
}
