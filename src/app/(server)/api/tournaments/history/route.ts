import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      include: {
        teams: { include: { tourCard: true } },
        golfers: true,
        course: true,
      },
    });
    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
