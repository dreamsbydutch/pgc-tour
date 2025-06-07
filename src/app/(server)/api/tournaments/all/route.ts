import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      where: { season: { year: new Date().getFullYear() } },
      include: { course: true },
      orderBy: { startDate: "asc" },
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
