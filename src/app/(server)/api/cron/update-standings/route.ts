"use server";

import { api } from "@/trpc/server";
import { Team, TourCard } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Calculates statistics for a tour card based on completed teams
 */
async function calculateTourCardStats<T extends TourCard>(
  tourCard: T,
): Promise<T> {
  let teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
  teams = teams.filter((obj) => (obj.round ?? 0) > 4);

  const stats = {
    win: calculateWins(teams),
    topTen: calculateTopTens(teams),
    madeCut: calculateMadeCuts(teams),
    appearances: teams.length,
    earnings: calculateTotalEarnings(teams),
    points: calculateTotalPoints(teams),
  };

  return { ...tourCard, ...stats };
}

/**
 * Calculates number of wins from teams
 */
function calculateWins(teams: Team[]): number {
  return teams.filter((team) => +(team.position?.replace("T", "") ?? 0) === 1)
    .length;
}

/**
 * Calculates number of top-10 finishes from teams
 */
function calculateTopTens(teams: Team[]): number {
  return teams.filter((team) => +(team.position?.replace("T", "") ?? 0) <= 10)
    .length;
}

/**
 * Calculates number of made cuts from teams
 */
function calculateMadeCuts(teams: Team[]): number {
  return teams.filter((team) => team.position !== "CUT").length;
}

/**
 * Calculates total earnings from teams
 */
function calculateTotalEarnings(teams: Team[]): number {
  return teams.reduce(
    (total, team) => (total += Math.round((team.earnings ?? 0) * 100) / 100),
    0,
  );
}

/**
 * Calculates total points from teams
 */
function calculateTotalPoints(teams: Team[]): number {
  return teams.reduce(
    (total, team) => (total += Math.round(team.points ?? 0)),
    0,
  );
}

/**
 * Groups tour cards by their tour ID
 */
function groupTourCardsByTour<T extends TourCard>(
  tourCards: T[],
): Map<string, T[]> {
  const tourGroups = new Map<string, T[]>();

  tourCards.forEach((tourCard) => {
    const tourId = tourCard.tourId;
    if (!tourGroups.has(tourId)) {
      tourGroups.set(tourId, []);
    }
    tourGroups.get(tourId)!.push(tourCard);
  });

  return tourGroups;
}

/**
 * Sorts tour cards within a tour by points (desc) and earnings (desc) as tiebreaker
 */
// function sortTourCardsByRanking<T extends TourCard>(tourCards: T[]): T[] {
//   return tourCards.sort((a, b) => {
//     if ((b.points ?? 0) !== (a.points ?? 0)) {
//       return (b.points ?? 0) - (a.points ?? 0);
//     }
//     return (b.earnings ?? 0) - (a.earnings ?? 0);
//   });
// }

/**
 * Assigns positions to tour cards with proper tie handling
 */
function assignPositions<T extends TourCard>(tourCards: T[]): void {
  let currentPosition = 1;

  console.log(
    "Assigning positions for tour cards:",
    tourCards.map((card) => ({
      id: card.id,
      displayName: card.displayName,
      points: card.points,
      earnings: card.earnings,
    })),
  );

  for (let i = 0; i < tourCards.length; i++) {
    const currentCard = tourCards[i];
    if (!currentCard) continue;

    // Update position if points changed from previous card
    if (i > 0) {
      const previousCard = tourCards[i - 1];
      if (!previousCard) continue;

      if ((currentCard.points ?? 0) !== (previousCard.points ?? 0)) {
        currentPosition = i + 1;
      }
    }

    // Check for ties at this points level
    const samePointsCards = tourCards.filter(
      (card) => card && (card.points ?? 0) === (currentCard.points ?? 0),
    );
    const hasTies = samePointsCards.length > 1;

    currentCard.position = `${hasTies ? "T" : ""}${currentPosition}`;

    console.log(
      `Assigned position ${currentCard.position} to ${currentCard.displayName} (${currentCard.points} pts)`,
    );
  }
}

/**
 * Calculates standings positions for all tour cards
 */
function calculateStandingsPositions<T extends TourCard>(tourCards: T[]): void {
  const tourGroups = groupTourCardsByTour(tourCards);

  tourGroups.forEach((cardsInTour) => {
    // Sort the array in place to maintain object references
    cardsInTour.sort((a, b) => {
      if ((b.points ?? 0) !== (a.points ?? 0)) {
        return (b.points ?? 0) - (a.points ?? 0);
      }
      return (b.earnings ?? 0) - (a.earnings ?? 0);
    });

    assignPositions(cardsInTour);
  });
}

/**
 * Updates all tour cards in the database
 */
async function updateTourCardsInDatabase<T extends TourCard>(
  tourCards: T[],
): Promise<T[]> {
  return Promise.all(
    tourCards.map(async (tourCard) => {
      await api.tourCard.update({
        id: tourCard.id,
        position: tourCard.position ?? undefined,
        points: tourCard.points ?? undefined,
        earnings: tourCard.earnings,
        win: tourCard.win,
        topTen: tourCard.topTen,
        madeCut: tourCard.madeCut,
        appearances: tourCard.appearances,
      });
      return tourCard;
    }),
  );
}

/**
 * Sends cache invalidation notification
 */
async function notifyCacheInvalidation(origin: string): Promise<void> {
  try {
    const invalidateResponse = await fetch(`${origin}/api/cache/invalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "tourCards",
        source: "cron-update-standings",
      }),
    });

    if (invalidateResponse.ok) {
      console.log("✅ Cache invalidation notification sent successfully");
    } else {
      console.error("❌ Failed to send cache invalidation notification");
    }
  } catch (error) {
    console.error("Error sending cache invalidation notification:", error);
  }
}

/**
 * Main function to update standings for all tour cards
 */
export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  const season = await api.season.getCurrent();
  let tourCards = await api.tourCard.getBySeason({
    seasonId: season?.id ?? "",
  });

  if (tourCards) {
    tourCards = await Promise.all(
      tourCards.map(async (tourCard) => {
        let teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
        teams = teams.filter((obj) => (obj.round ?? 0) > 4);
        tourCard.win = teams.filter(
          (obj) => +(obj.position?.replace("T", "") ?? 0) === 1,
        ).length;
        tourCard.topTen = teams.filter(
          (obj) => +(obj.position?.replace("T", "") ?? 0) <= 10,
        ).length;
        tourCard.madeCut = teams.filter((obj) => obj.position !== "CUT").length;
        tourCard.appearances = teams.length;
        tourCard.earnings = teams.reduce(
          (p, c) => (p += Math.round((c.earnings ?? 0) * 100) / 100),
          0,
        );
        tourCard.points = teams.reduce(
          (p, c) => (p += Math.round(c.points ?? 0)),
          0,
        );
        return tourCard;
      }),
    );
    tourCards = await Promise.all(
      tourCards.map(async (tourCard) => {
        tourCard.position =
          (tourCards &&
          tourCards.filter(
            (a) => a.tourId === tourCard.tourId && a.points === tourCard.points,
          ).length > 1
            ? "T"
            : "") +
          (tourCards &&
            tourCards.filter(
              (a) =>
                a.tourId === tourCard.tourId &&
                (a.points ?? 0) > (tourCard.points ?? 0),
            ).length + 1);
        await api.tourCard.update({
          id: tourCard.id,
          position: tourCard.position,
          points: tourCard.points ?? undefined,
          earnings: tourCard.earnings,
          win: tourCard.win,
          topTen: tourCard.topTen,
          madeCut: tourCard.madeCut,
          appearances: tourCard.appearances,
        });
        return tourCard;
      }),
    );
  }
  return NextResponse.redirect(`${origin}/`);
}

// localhost:3000/cron/update-standings
