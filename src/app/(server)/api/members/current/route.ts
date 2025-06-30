import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { db } from "@/src/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Add small delay to prevent race conditions during app initialization
    await new Promise((resolve) => setTimeout(resolve, 50));

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    // If no user is logged in, return null member instead of error
    if (error || !data.user) {
      return NextResponse.json({ member: null });
    }

    const member = await db.member.findUnique({
      where: { id: data.user.id },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error fetching current member:", error);

    // Return null member instead of error to prevent cascading failures
    return NextResponse.json({ member: null });
  }
}
