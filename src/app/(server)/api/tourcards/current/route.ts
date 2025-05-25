import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tourCards = await db.tourCard.findMany({
      where: { season: { year: new Date().getFullYear() } },
    });
    return NextResponse.json({ tourCards });
  } catch (error) {
    console.error("Error fetching tour card:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour card" },
      { status: 500 },
    );
  }
}
