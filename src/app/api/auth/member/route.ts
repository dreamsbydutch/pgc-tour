import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    const member = await db.member.findUnique({
      where: { id: userId },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Failed to fetch member:", error);
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 });
  }
}
