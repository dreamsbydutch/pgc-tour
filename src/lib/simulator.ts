import type { Golfer } from "@prisma/client";
import type { TeamData } from "../types/prisma_include";

/**
 * Returns a random number following a normal distribution
 * using the Box-Muller transform.
 * The returned value has approximately mean 0 and standard deviation 1.
 */
function randnBM(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Simulate a round differential (strokes relative to par) for a golfer.
 *
 * If the golfer already has an actual score for the round (e.g. roundOne),
 * we convert it to a differential by subtracting par.
 *
 * Otherwise, we simulate a differential using a Gaussian (normal)
 * random variable. The expected differential is computed using a base mean
 * (set to 3) plus a small adjustment based primarily on the golfer's rating
 * (with a weight of -0.05 per point above 85) and secondarily on their worldRank
 * (with a weight of -0.02 for each place above 50, capped at the top 50).
 *
 * We add normally distributed noise with a standard deviation of 3.5.
 * Finally, we clamp the simulated differential to the range [-5, +8].
 */
function simulateRound(
  golfer: Golfer,
  roundKey: keyof Golfer,
  par: number,
): number {
  if (golfer[roundKey] != null) {
    // Use the actual score and convert to differential.
    return Number(golfer[roundKey]) - par;
  }
  const baseMean = 3;
  const ratingAdjustment =
    golfer.rating != null ? (golfer.rating - 85) * -0.05 : 0;
  const worldRankAdjustment =
    golfer.worldRank != null ? Math.max(0, 50 - golfer.worldRank) * -0.02 : 0;
  const meanDiff = baseMean + ratingAdjustment + worldRankAdjustment;
  const sigma = 3.5;
  let simulatedDiff = meanDiff + randnBM() * sigma;
  if (simulatedDiff < -5) simulatedDiff = -5;
  if (simulatedDiff > 8) simulatedDiff = 8;
  return simulatedDiff;
}

/**
 * Simulate all four rounds for a single golfer.
 *
 * For rounds one and two, if an actual score exists, we use it; otherwise we simulate it.
 *
 * For rounds three and four:
 *   - If any actual data exists (i.e. roundThree or roundFour is provided),
 *     we use the actual score for that round (simulating only missing ones).
 *   - Otherwise, we decide if the golfer makes the cut based on their makeCut probability (default 0.9).
 *     If not, rounds three and four are set to Infinity.
 *
 * This logic lets the simulation run at any point in the tournament.
 */
function simulateGolfer(golfer: Golfer, par: number) {
  const r1 = simulateRound(golfer, "roundOne", par);
  const r2 = simulateRound(golfer, "roundTwo", par);

  let r3: number, r4: number;
  if (golfer.roundThree != null || golfer.roundFour != null) {
    r3 = simulateRound(golfer, "roundThree", par);
    r4 = simulateRound(golfer, "roundFour", par);
  } else {
    const makeCutProb = golfer.makeCut ?? 0.9;
    const makesCut = Math.random() < makeCutProb;
    if (makesCut) {
      r3 = simulateRound(golfer, "roundThree", par);
      r4 = simulateRound(golfer, "roundFour", par);
    } else {
      r3 = Infinity;
      r4 = Infinity;
    }
  }

  return {
    apiId: golfer.apiId,
    roundOne: r1,
    roundTwo: r2,
    roundThree: r3,
    roundFour: r4,
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
  r1r2: number;
  r3r4: number;
};

/**
 * Simulate the remainder (or entirety) of the tournament numSimulations times.
 *
 * golfers: Array of Golfer objects.
 * teams: Array of TeamData objects. Each team has a golferIds array and a related tourCard with tourId.
 * par: The course par (number) so we can convert strokes to differential.
 * numSimulations: Number of tournament simulations to run.
 *
 * For each simulation, we:
 *   - Simulate each golfer’s rounds (using actual scores when available).
 *   - Compute each team’s score:
 *       • Rounds 1 & 2: Average differential across all 10 golfers.
 *       • Rounds 3 & 4: Average of the best (lowest) 5 combined differentials among golfers who made the cut.
 *     If fewer than 5 golfers are available for rounds 3–4, the team is considered CUT.
 *   - Group teams by tour (using team.tourCard.tourId) and rank teams separately for each tour.
 *   - Tally for each tour group:
 *       • makeCut (team isn’t CUT),
 *       • topTen, topFive, topThree finishes,
 *       • wins (finishing first).
 *
 * Finally, the function updates each TeamData object with percentages (0–1)
 * for: makeCut, topTen, topFive, topThree, win.
 *
 * Returns the modified teams array.
 */
export function simulateTournament(
  golfers: Golfer[],
  teams: TeamData[],
  par: number,
  numSimulations: number,
): TeamData[] {
  // Build a map for quick lookup of teams by id.
  const teamMap = new Map<number, TeamData>();
  teams.forEach((t) => teamMap.set(t.id, t));

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
      const teamGolfers = team.golferIds
        .map((id) => simGolferMap.get(id))
        .filter((g) => g != null);

      if (teamGolfers.length < 10) {
        return { teamId: team.id, overall: Infinity, cut: true };
      }

      const totalR1R2 = teamGolfers.reduce((sum, g) => sum + g.r1r2, 0);
      const avgR1R2 = totalR1R2 / teamGolfers.length;

      const advancers = teamGolfers.filter((g) => g.r3r4 !== Infinity);
      if (advancers.length < 5) {
        return { teamId: team.id, overall: Infinity, cut: true };
      }
      advancers.sort((a, b) => a.r3r4 - b.r3r4);
      const bestFive = advancers.slice(0, 5);
      const totalR3R4 = bestFive.reduce((sum, g) => sum + g.r3r4, 0);
      const avgR3R4 = totalR3R4 / bestFive.length;

      const overall = avgR1R2 + avgR3R4;
      return { teamId: team.id, overall, cut: false };
    });

    // Group simulated team scores by tour (using team.tourCard.tourId).
    const tourGroups = new Map<
      string,
      Array<{ teamId: number; overall: number; cut: boolean }>
    >();
    simTeamScores.forEach((score) => {
      const team = teamMap.get(score.teamId);
      if (!team || !team.tourCard) return;
      const tourId = team.tourCard.tourId;
      if (!tourGroups.has(tourId)) {
        tourGroups.set(tourId, []);
      }
      tourGroups.get(tourId)!.push(score);
    });

    // For each tour group, sort teams by overall differential and update tallies.
    tourGroups.forEach((group) => {
      group.sort((a, b) => a.overall - b.overall);
      group.forEach((score, index) => {
        const res = teamResults[score.teamId];
        if (res && !score.cut) {
          res.makeCut++;
          if (index === 0) res.win++;
          if (index < 3) res.topThree++;
          if (index < 5) res.topFive++;
          if (index < 10) res.topTen++;
        }
      });
    });
  }

  // Update each team with the percentages (as decimals 0–1).
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
