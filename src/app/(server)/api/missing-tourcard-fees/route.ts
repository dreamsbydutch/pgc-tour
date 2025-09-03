import { NextResponse } from "next/server";
import { db } from "src/server/db";

export async function GET() {
  // Get all tour cards for 2025 season
  const seasonId = "cm4w910jz000gdx9k30u3ihpb"; // Change this to your actual seasonId value
  const tourCards = await db.tourCard.findMany({ where: { seasonId } });

  // Get all TourCardFee transactions for 2025 season
  const tourCardFees = await db.transactions.findMany({
    where: { seasonId, transactionType: "TourCardFee" },
  });

  // Build a set of userId+seasonId for all fees
  const feeKeys = new Set(
    tourCardFees.map((tx) => `${tx.userId}:${tx.seasonId}`),
  );

  // Find tour cards without a matching fee
  const missingFees = tourCards.filter(
    (tc) => !feeKeys.has(`${tc.memberId}:${tc.seasonId}`),
  );

  return NextResponse.json({ missingFees });
}
