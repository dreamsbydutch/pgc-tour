import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { db } from "@/src/server/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    return NextResponse.json(
      { error: "Failed to fetch current member" },
      { status: 500 },
    );
  }
}
