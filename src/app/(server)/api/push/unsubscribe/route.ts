// API route for unsubscribing from push notifications
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";

type Subscription = {
  endpoint: string;
};

type RequestBody = {
  subscription: Subscription;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RequestBody>;
    const { subscription } = body;

    if (!subscription || typeof subscription.endpoint !== "string") {
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
