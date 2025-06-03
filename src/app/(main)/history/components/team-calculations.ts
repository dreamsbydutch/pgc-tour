import type { Member, Team, Tier, TourCard } from "@prisma/client";

/**
 * Calculates positions for all teams based on scores
 * @param teams - Teams to calculate positions for
 * @param scoreMap - Map of team ID to score
 * @returns Map of team ID to position string
 */
export function calculatePositions(
  teams: Team[],
  scoreMap: Map<string, number>,
): Map<string, string> {
  // Group teams by score
  const teamsByScore = new Map<number, string[]>();

  // Add teams to score groups
  teams.forEach((team) => {
    if (team.position === "CUT") return;
    const score = scoreMap.get(team.id.toString());
    if (score === undefined) return;

    if (!teamsByScore.has(score)) {
      teamsByScore.set(score, []);
    }
    teamsByScore.get(score)?.push(team.id.toString());
  });

  // Sort scores (lowest to highest)
  const sortedScores = Array.from(teamsByScore.keys()).sort((a, b) => a - b);

  // Calculate positions
  const positionMap = new Map<string, string>();
  let positionCount = 1;

  sortedScores.forEach((score) => {
    const teamsWithScore = teamsByScore.get(score) ?? [];
    const positionString =
      teamsWithScore.length > 1 ? `T${positionCount}` : `${positionCount}`;

    // Assign position to each team with this score
    teamsWithScore.forEach((teamId) => {
      positionMap.set(teamId, positionString);
    });

    // Update position counter for next score group
    positionCount += teamsWithScore.length;
  });

  return positionMap;
}

/**
 * Calculates earnings and points based on position and tier information
 */
export function calculateEarningsAndPoints(
  team: Team,
  tourTeams: Team[],
  tier: Tier,
): { earnings: number; points: number } {
  if (team.position === "CUT") {
    return { earnings: 0, points: 0 };
  }

  // Validate tier data
  if (!tier?.points?.length || !tier?.payouts?.length) {
    return { earnings: 0, points: 0 };
  }

  // Handle tied positions
  if (team.position?.includes("T")) {
    // Find all teams tied at this position
    const tiedTeams = tourTeams.filter((t) => t.position === team.position);
    const positionIndex = parseInt(team.position.replace("T", ""), 10) - 1;

    if (isNaN(positionIndex) || positionIndex < 0) {
      return { earnings: 0, points: 0 };
    }

    // Safety check to prevent out-of-bounds access
    const safeEndIndex = Math.min(
      positionIndex + tiedTeams.length,
      tier.points.length,
      tier.payouts.length,
    );

    if (
      positionIndex >= tier.points.length ||
      positionIndex >= tier.payouts.length
    ) {
      return { earnings: 0, points: 0 };
    }

    // Calculate average points and earnings for the tied positions
    const pointsTotal = tier.points
      .slice(positionIndex, safeEndIndex)
      .reduce((sum, val) => sum + val, 0);

    const earningsTotal = tier.payouts
      .slice(positionIndex, safeEndIndex)
      .reduce((sum, val) => sum + val, 0);

    return {
      earnings: earningsTotal / tiedTeams.length || 0,
      points: pointsTotal / tiedTeams.length || 0,
    };
  } else {
    // Handle non-tied positions
    const positionIndex = parseInt(team.position ?? "1", 10) - 1;

    if (isNaN(positionIndex) || positionIndex < 0) {
      return { earnings: 0, points: 0 };
    }

    // Safety check for index bounds
    if (
      positionIndex >= tier.points.length ||
      positionIndex >= tier.payouts.length
    ) {
      return { earnings: 0, points: 0 };
    }

    return {
      earnings: tier.payouts[positionIndex] ?? 0,
      points: tier.points[positionIndex] ?? 0,
    };
  }
}

/**
 * Updates team positions, earnings, and points based on tournament results
 * @param teams - Array of teams to update
 * @param tourCards - Tournament card data with member information
 * @param tier - The tier information containing points and payouts
 * @param tournamentName - Optional tournament name to check for TOUR Championship special handling
 * @returns Array of teams with updated positions, earnings, and points
 */
export function updateTeamPositions(
  teams: Team[],
  tourCards: (TourCard & { member?: Member })[] | undefined,
  tier: Tier | undefined,
  tournamentName?: string,
): Team[] {
  // Return early if no valid input data
  if (!teams.length || !tier) {
    return teams;
  }

  // Deep clone teams to avoid modifying the original data
  const updatedTeams = [...teams];

  // Check if this is the TOUR Championship
  const isTourChampionship = tournamentName === "TOUR Championship";

  // Create separate tier copies for different playoff scenarios
  const tierForPlayoff1 = tier
    ? {
        ...tier,
        // For playoff = 1 teams, use the first set of positions (1-30)
        payouts: tier.payouts ? tier.payouts.slice(0, 75) : [],
        points: tier.points ? tier.points.slice(0, 75) : [],
      }
    : undefined;

  const tierForPlayoff2 = tier
    ? {
        ...tier,
        // For playoff = 2 teams, use positions starting from 75 (75-105)
        payouts: tier.payouts ? tier.payouts.slice(75, 150) : [],
        points: tier.points ? tier.points.slice(75, 150) : [],
      }
    : undefined;

  // Group teams by tour to handle each tournament separately (optimization)
  const teamsByTourId = teams.reduce(
    (acc, team) => {
      const tourId = tourCards?.find((t) => t.id === team.tourCardId)?.tourId;
      if (tourId) {
        if (!acc[tourId]) acc[tourId] = [];
        acc[tourId].push(team);
      }
      return acc;
    },
    {} as Record<string, Team[]>,
  );

  // Precompute score maps for faster lookups
  const scoreMap = new Map<string, number>();
  const pastScoreMap = new Map<string, number>();

  // Populate score maps
  teams.forEach((team) => {
    if (team.position !== "CUT") {
      scoreMap.set(team.id.toString(), team.score ?? 100);
      pastScoreMap.set(
        team.id.toString(),
        (team.score ?? 100) - (team.today ?? 0),
      );
    }
  });

  // For TOUR Championship, we need to create two separate groups for playoffs
  const playoff1Teams: Team[] = [];
  const playoff2Teams: Team[] = [];
  let playoff1Positions: Map<string, string> = new Map<string, string>();
  let playoff2Positions: Map<string, string> = new Map<string, string>();

  if (isTourChampionship) {
    // Split teams into two separate competitions based on playoff status
    updatedTeams.forEach((team) => {
      const tourCard = tourCards?.find((t) => t.id === team.tourCardId);
      if (tourCard?.playoff === 2) {
        playoff2Teams.push(team);
      } else {
        playoff1Teams.push(team);
      }
    });

    // Calculate positions separately for each group
    const playoff1ScoreMap = new Map<string, number>();
    const playoff2ScoreMap = new Map<string, number>();

    playoff1Teams.forEach((team) => {
      if (team.position !== "CUT") {
        playoff1ScoreMap.set(team.id.toString(), team.score ?? 100);
      }
    });

    playoff2Teams.forEach((team) => {
      if (team.position !== "CUT") {
        playoff2ScoreMap.set(team.id.toString(), team.score ?? 100);
      }
    });

    // Calculate positions separately for each playoff group
    playoff1Positions = calculatePositions(playoff1Teams, playoff1ScoreMap);
    playoff2Positions = calculatePositions(playoff2Teams, playoff2ScoreMap);
  }

  // Pre-calculate positions once for efficiency
  const positions = isTourChampionship
    ? new Map([...playoff1Positions, ...playoff2Positions])
    : calculatePositions(teams, scoreMap);

  const pastPositions = calculatePositions(teams, pastScoreMap);

  // Process each team to update positions and calculate earnings/points
  return updatedTeams.map((team) => {
    const tourCard = tourCards?.find((t) => t.id === team.tourCardId);
    if (!tourCard) return team;

    // For regular tournaments or non-Tour Championship, use the complete list of teams
    // For Tour Championship, use only the teams in the same playoff group
    let relevantTeams = teamsByTourId[tourCard.tourId] ?? [];

    // For Tour Championship, filter teams by playoff status
    if (isTourChampionship) {
      relevantTeams = tourCard.playoff === 2 ? playoff2Teams : playoff1Teams;
    }

    // Set position from pre-calculated maps
    team.position =
      team.position === "CUT"
        ? "CUT"
        : positions.get(team.id.toString()) ?? "1";

    // Set past position from pre-calculated maps
    team.pastPosition =
      team.position === "CUT"
        ? "CUT"
        : pastPositions.get(team.id.toString()) ?? "1";

    // Determine which tier to use based on playoff status
    let tierToUse;
    if (isTourChampionship && tourCard.playoff === 2) {
      // For playoff = 2, use the special tier with offset payouts
      tierToUse = tierForPlayoff2;
    } else {
      // For playoff = 1 or undefined/0, use the regular tier
      tierToUse = tierForPlayoff1;
    }

    if (!tierToUse) return team;

    // Calculate earnings and points
    const { earnings, points } = calculateEarningsAndPoints(
      team,
      relevantTeams, // Use the filtered teams specific to their playoff group
      tierToUse,
    );

    // Round values for display
    team.earnings = Math.round(earnings * 100) / 100;
    team.points = Math.round(points);

    return team;
  });
}
