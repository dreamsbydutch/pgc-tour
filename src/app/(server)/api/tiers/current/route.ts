import { NextResponse } from "next/server";
import { db } from "@/src/server/db";

export async function GET() {
  try {
    const tiers = await db.tier.findMany({
      where: { season: { year: new Date().getFullYear() } },
    });
    return NextResponse.json({ tiers });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
