import { NextResponse } from "next/server";
import { db } from "@/src/server/db";

export async function GET() {
  try {
    // Query the database directly instead of using tRPC
    const tours = await db.tour.findMany({
      where: { season: { year: new Date().getFullYear() } },
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
