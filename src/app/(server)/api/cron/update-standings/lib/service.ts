/**
 * UPDATE STANDINGS SERVICE
 * ========================
 *
 * Streamlined service that:
 * 1. Fetches current season and tour cards
 * 2. Calculates statistics for each tour card (wins, top tens, earnings, etc.)
 * 3. Determines positions based on points
 * 4. Batch updates all tour cards in the database
 */

import type { createCaller } from "@pgc-server";
import { batchProcess } from "@pgc-utils";
import type {
  TourCardWithRelations,
  TourCardCalculation,
  UpdateResult,
} from "./types";

/**
 * Main function to update standings for all tour cards
 */
export async function updateStandingsOptimized(
  api: ReturnType<typeof createCaller>,
): Promise<UpdateResult> {
  console.log("🚀 Starting standings update");

  const season = await api.season.getCurrent();
  if (!season) {
    console.log("⚠️ No current season found");
    return {
      tourCardsUpdated: 0,
      seasonProcessed: false,
      totalTourCards: 0,
    };
  }

  const tourCards = await api.tourCard.getBySeason({
    seasonId: season.id,
  });

  if (!tourCards?.length) {
    console.log("⚠️ No tour cards found for current season");
    return {
      tourCardsUpdated: 0,
      seasonProcessed: true,
      totalTourCards: 0,
    };
  }

  console.log(`📊 Processing ${tourCards.length} tour cards`);

  // First pass: calculate stats for each tour card
  const calculatedTourCards = await calculateTourCardStats(tourCards, api);

  // Second pass: calculate positions and update in database
  const updateResult = await updateTourCardPositions(calculatedTourCards, api);

  console.log(`✅ Updated ${updateResult.tourCardsUpdated} tour cards`);

  return {
    tourCardsUpdated: updateResult.tourCardsUpdated,
    seasonProcessed: true,
    totalTourCards: tourCards.length,
  };
}

/**
 * Calculate statistics for each tour card
 */
async function calculateTourCardStats(
  tourCards: TourCardWithRelations[],
  api: ReturnType<typeof createCaller>,
): Promise<TourCardCalculation[]> {
  console.log("📊 Calculating tour card statistics");

  const calculations: TourCardCalculation[] = [];

  await batchProcess(
    tourCards,
    10,
    async (tourCard) => {
      let teams = await api.team.getByTourCard({ tourCardId: tourCard.id });

      // Only include teams that have completed at least 4 rounds
      teams = teams.filter((obj) => (obj.round ?? 0) > 4);

      const calculation: TourCardCalculation = {
        id: tourCard.id,
        tourId: tourCard.tourId,
        win: teams.filter((obj) => +(obj.position?.replace("T", "") ?? 0) === 1)
          .length,
        topTen: teams.filter(
          (obj) => +(obj.position?.replace("T", "") ?? 0) <= 10,
        ).length,
        madeCut: teams.filter((obj) => obj.position !== "CUT").length,
        appearances: teams.length,
        earnings: teams.reduce(
          (p, c) => (p += Math.round((c.earnings ?? 0) * 100) / 100),
          0,
        ),
        points: teams.reduce((p, c) => (p += Math.round(c.points ?? 0)), 0),
      };

      calculations.push(calculation);
    },
    100,
  );

  return calculations;
}

/**
 * Calculate positions and update tour cards in database
 */
async function updateTourCardPositions(
  calculations: TourCardCalculation[],
  api: ReturnType<typeof createCaller>,
): Promise<{ tourCardsUpdated: number }> {
  console.log("🔄 Updating tour card positions");

  let updatedCount = 0;

  await batchProcess(
    calculations,
    10,
    async (calculation) => {
      // Calculate position based on points
      const samePointsCount = calculations.filter(
        (a) =>
          a.tourId === calculation.tourId && a.points === calculation.points,
      ).length;

      const betterPointsCount = calculations.filter(
        (a) =>
          a.tourId === calculation.tourId &&
          (a.points ?? 0) > (calculation.points ?? 0),
      ).length;

      const position =
        (samePointsCount > 1 ? "T" : "") + (betterPointsCount + 1);

      await api.tourCard.update({
        id: calculation.id,
        position: position,
        points: calculation.points,
        earnings: calculation.earnings,
        win: calculation.win,
        topTen: calculation.topTen,
        madeCut: calculation.madeCut,
        appearances: calculation.appearances,
      });

      updatedCount++;
    },
    50,
  );

  return { tourCardsUpdated: updatedCount };
}
