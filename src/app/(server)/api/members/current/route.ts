import { NextResponse } from "next/server";
import { checkIfUserExists } from "@/src/server/api/actions/member";

export async function GET() {
  try {
    const member = await checkIfUserExists();
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error fetching current member:", error);
    return NextResponse.json(
      { error: "Failed to fetch current member" },
      { status: 500 },
    );
  }
}
