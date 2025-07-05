// API route for unsubscribing from push notifications
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/server/db";

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "Subscription endpoint required" },
        { status: 400 },
      );
    }

    // Remove subscription from database
    await db.pushSubscription.deleteMany({
      where: {
        endpoint: subscription.endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 },
    );
  }
}
