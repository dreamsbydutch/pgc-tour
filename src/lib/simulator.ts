import { Golfer, Team } from "@prisma/client";
/**
 * Simulate a round differential (strokes relative to par) for a golfer.
 *
 * If the golfer already has an actual score for the round (e.g. roundOne),
 * we convert it to a differential by subtracting par.
 *
 * Otherwise, we simulate a differential in the range [-7, +5],
 * then adjust it based on the golfer's worldRank and rating.
 */
function simulateRound(golfer: Golfer, roundKey: keyof Golfer, par: number) {
  if (golfer[roundKey] != null) {
    // Convert actual strokes to differential.
    return Number(golfer[roundKey]) - par;
  }
  // Generate a base random differential between -7 and +5.
  const baseDiff = Math.random() * (5 - -7) + -7;

  // Adjust based on worldRank and rating.
  let adjustment = 0;
  if (golfer.worldRank != null) {
    // For example, a top 50 golfer gets a small negative adjustment.
    adjustment -= Math.max(0, (50 - Math.min(golfer.worldRank, 50)) / 50);
  }
  if (golfer.rating != null) {
    // Assume an average rating of 90.
    adjustment -= (golfer.rating - 90) * 0.05;
  }

  let simulatedDiff = baseDiff + adjustment;
  // Clamp the value to be within [-7, +5].
  if (simulatedDiff < -7) simulatedDiff = -7;
  if (simulatedDiff > 5) simulatedDiff = 5;
  return simulatedDiff;
}

/**
 * Simulate all four rounds for a single golfer.
 *
 * For each round, if an actual score exists, we use it; otherwise we simulate it.
 * After rounds one and two, we decide if the golfer makes the cut based on
 * their makeCut probability (default 0.9). If not, rounds three and four are set to Infinity.
 *
 * This function works whether the tournament hasn’t started (no rounds),
 * is in progress (some rounds available), or is complete.
 */
function simulateGolfer(golfer: Golfer, par: number) {
  // Use actual data if present; otherwise simulate.
  const r1 = simulateRound(golfer, "roundOne", par);
  const r2 = simulateRound(golfer, "roundTwo", par);

  // After rounds 1 & 2, decide if the golfer makes the cut.
  // (Even if these rounds are actual, we simulate the uncertainty of making the cut.)
  const makeCutProb = golfer.makeCut ?? 0.9;
  const makesCut = Math.random() < makeCutProb;

  let r3, r4;
  if (makesCut) {
    r3 = simulateRound(golfer, "roundThree", par);
    r4 = simulateRound(golfer, "roundFour", par);
  } else {
    r3 = Infinity;
    r4 = Infinity;
  }

  return {
    apiId: golfer.apiId,
    roundOne: r1,
    roundTwo: r2,
    roundThree: r3,
    roundFour: r4,
    // Combined differentials for convenience.
    r1r2: r1 + r2,
    r3r4: r3 === Infinity || r4 === Infinity ? Infinity : r3 + r4,
  };
}
type simGolfer = {
  apiId: number;
  roundOne: number;
  roundTwo: number;
  roundThree: number;
  roundFour: number;
  // Combined differentials for convenience.
  r1r2: number;
  r3r4: number;
};

/**
 * Simulate the remainder (or entirety) of the tournament numSimulations times.
 *
 * golfers: Array of Golfer objects (from Prisma).
 * teams: Array of Team objects (using your Prisma Team schema). Each team has a golferIds array.
 * par: The course par (number) so we can convert strokes to differential.
 * numSimulations: Number of tournament simulations to run.
 *
 * For each simulation, we:
 *   - Simulate each golfer’s rounds (using actual scores when available).
 *   - Compute each team’s score:
 *       • Rounds 1 & 2: Average differential across all 10 golfers.
 *       • Rounds 3 & 4: Average of the best (lowest) 5 combined differentials among golfers who made the cut.
 *     If fewer than 5 golfers are available for rounds 3–4, the team is considered CUT.
 *   - Rank teams (lower overall differential is better) and tally:
 *       • makeCut (team isn’t CUT),
 *       • topTen, topFive, topThree finishes,
 *       • wins (finishing first).
 *
 * Finally, the function updates each Team object with percentages (0–100) for:
 *   - makeCut, topTen, topFive, topThree, win
 *
 * Returns the modified teams array.
 */
export function simulateTournament(
  golfers: Golfer[],
  teams: Team[],
  par: number,
  numSimulations: number,
) {
  // Prepare tallies per team.
  const teamResults = teams.reduce(
    (acc, team) => {
      (
        acc as Record<
          string,
          {
            makeCut: number;
            topTen: number;
            topFive: number;
            topThree: number;
            win: number;
          }
        >
      )[team.id] = { makeCut: 0, topTen: 0, topFive: 0, topThree: 0, win: 0 };
      return acc;
    },
    {} as Record<
      string,
      {
        makeCut: number;
        topTen: number;
        topFive: number;
        topThree: number;
        win: number;
      }
    >,
  );

  for (let sim = 0; sim < numSimulations; sim++) {
    // Simulate each golfer’s rounds (using actual scores if available).
    const simGolferMap = new Map<number, simGolfer>();
    golfers.forEach((g) => {
      simGolferMap.set(g.apiId, simulateGolfer(g, par));
    });

    // Compute each team’s score for this simulation.
    const simTeamScores = teams.map((team) => {
      // Get simulated results for the team’s golfers.
      const teamGolfers = team.golferIds
        .map((id) => simGolferMap.get(id))
        .filter((g) => g != null);

      // If team doesn't have 10 golfers, mark as CUT.
      if (teamGolfers.length < 10) {
        return { teamId: team.id, overall: Infinity, cut: true };
      }

      // Rounds 1 & 2: average differential over all 10 golfers.
      const totalR1R2 = teamGolfers.reduce((sum, g) => sum + g.r1r2, 0);
      const avgR1R2 = totalR1R2 / teamGolfers.length;

      // Rounds 3 & 4: only include golfers who made the cut (finite r3r4).
      const advancers = teamGolfers.filter((g) => g.r3r4 !== Infinity);
      if (advancers.length < 5) {
        return { teamId: team.id, overall: Infinity, cut: true };
      }
      // Sort the advancing golfers by their combined rounds 3+4 differential.
      advancers.sort((a, b) => a.r3r4 - b.r3r4);
      const bestFive = advancers.slice(0, 5);
      const totalR3R4 = bestFive.reduce((sum, g) => sum + g.r3r4, 0);
      const avgR3R4 = totalR3R4 / bestFive.length;

      // Overall team differential: lower is better.
      const overall = avgR1R2 + avgR3R4;
      return { teamId: team.id, overall, cut: false };
    });

    // Rank teams by overall differential (Infinity means CUT, so they rank last).
    simTeamScores.sort((a, b) => a.overall - b.overall);

    // Tally simulation results per team.
    simTeamScores.forEach((teamScore, index) => {
      const res = teamResults[teamScore.teamId];
      if (res && !teamScore.cut) {
        res.makeCut++; // team made the cut in this simulation.
        if (index === 0) res.win++; // first place.
        if (index < 3) res.topThree++; // top 3.
        if (index < 5) res.topFive++; // top 5.
        if (index < 10) res.topTen++; // top 10.
      }
    });
  }

  // Update each team with the percentages.
  teams.forEach((team) => {
    const res = teamResults[team.id];
    if (res) {
      team.makeCut = res.makeCut / numSimulations;
      team.topTen = res.topTen / numSimulations;
      team.topFive = res.topFive / numSimulations;
      team.topThree = res.topThree / numSimulations;
      team.win = res.win / numSimulations;
    }
  });

  return teams;
}

/* 
  Usage Example:
  
  // Golfer objects – may have actual data for rounds that are complete.
  const golfers = [
    {
      apiId: 1,
      playerName: "Alice",
      // For example, if roundOne is complete:
      roundOne: 70,  // actual strokes
      // If roundTwo isn’t complete, it may be null or undefined.
      roundTwo: null,
      // Similarly for rounds 3 and 4.
      roundThree: null,
      roundFour: null,
      worldRank: 10,
      rating: 92,
      makeCut: 0.93,
      tournamentId: "T1"
    },
    {
      apiId: 2,
      playerName: "Bob",
      roundOne: 71,
      roundTwo: 73,
      roundThree: null,
      roundFour: null,
      worldRank: 25,
      rating: 88,
      makeCut: 0.90,
      tournamentId: "T1"
    },
    // ... ensure you have at least 10 golfers per team.
  ];
  
  // Team objects (as defined in your Prisma schema).
  const teams = [
    { id: 1, golferIds: [1,2,3,4,5,6,7,8,9,10], tournamentId: "T1" },
    { id: 2, golferIds: [11,12,13,14,15,16,17,18,19,20], tournamentId: "T1" },
    // ... additional teams.
  ];
  
  const par = 71;           // The course par.
  const numSimulations = 10000;
  const updatedTeams = simulateTournament(golfers, teams, par, numSimulations);
  console.log(updatedTeams);
  */
