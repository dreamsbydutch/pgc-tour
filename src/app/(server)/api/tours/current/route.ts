import { checkIfUserExists } from "@/src/server/api/actions/member";
import { db } from "@/src/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const user = await checkIfUserExists();
    const tourCard = await db.tourCard.findFirst({
      where: { memberId: user?.id ?? "", season: { year } },
    });
    const tour = await db.tour.findUnique({ where: { id: tourCard?.tourId } });
    return NextResponse.json({ tour });
  } catch (error) {
    console.error("Error fetching tournament info:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament information" },
      { status: 500 },
    );
  }
}
