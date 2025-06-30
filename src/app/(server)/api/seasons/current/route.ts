import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();

    // Check if current year season exists
    let season = await db.season.findFirst({
      where: { year: currentYear },
    });

    // If not, create it
    if (!season) {
      console.log(`Creating season for year ${currentYear}`);
      season = await db.season.create({
        data: {
          year: currentYear,
          number: 1, // Default season number
        },
      });
    }

    // Also check for tour cards count for debugging
    const tourCardsCount = await db.tourCard.count({
      where: { seasonId: season.id },
    });

    return NextResponse.json({
      season,
      tourCardsCount,
      message: `Season ${currentYear} ready with ${tourCardsCount} tour cards`,
    });
  } catch (error) {
    console.error("Error fetching/creating season:", error);
    return NextResponse.json(
      { error: "Failed to fetch season information" },
      { status: 500 },
    );
  }
}
