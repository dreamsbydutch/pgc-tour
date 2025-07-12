/**
 * API route for subscribing to push notifications
 * Saves push subscription data to the database linked to a member ID
 */
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@pgc-server";

type SubscriptionKeys = {
  p256dh: string;
  auth: string;
};

type Subscription = {
  endpoint: string;
  keys?: SubscriptionKeys;
  getKey?: (name: "p256dh" | "auth") => string;
};

type RequestBody = {
  subscription: Subscription;
  memberId: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RequestBody>;
    const { subscription, memberId } = body;

    // Validate required fields
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !memberId ||
      typeof memberId !== "string"
    ) {
      return NextResponse.json(
        { error: "Subscription and memberId are required" },
        { status: 400 },
      );
    }

    // Check if this exact subscription already exists
    const existingSubscription = await db.pushSubscription.findUnique({
      where: {
        memberId_endpoint: {
          memberId,
          endpoint: subscription.endpoint,
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "Already subscribed",
      });
    }

    // Extract encryption keys from subscription
    let p256dh: string | undefined;
    let auth: string | undefined;

    try {
      if (typeof subscription.getKey === "function") {
        p256dh = subscription.getKey("p256dh");
        auth = subscription.getKey("auth");
      } else if (subscription.keys) {
        p256dh = subscription.keys.p256dh;
        auth = subscription.keys.auth;
      }

      if (!p256dh || !auth) {
        return NextResponse.json(
          { error: "Invalid subscription format - missing encryption keys" },
          { status: 400 },
        );
      }
    } catch (keyError) {
      console.error("Error extracting keys:", keyError);
      return NextResponse.json(
        { error: "Failed to extract subscription keys" },
        { status: 400 },
      );
    } // Save new subscription to database
    await db.pushSubscription.create({
      data: {
        memberId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
