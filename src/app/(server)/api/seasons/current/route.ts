import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const season = await db.season.findFirst({
      where: { year: new Date().getFullYear() },
    });
    return NextResponse.json({ season });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
