/**
 * API route for subscribing to push notifications
 * Saves push subscription data to the database linked to a member ID
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const { subscription, memberId } = await request.json();

    // Validate required fields
    if (!subscription || !memberId) {
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
    let p256dh: string;
    let auth: string;

    try {
      if (subscription.getKey) {
        // Standard method for extracting keys
        p256dh = subscription.getKey("p256dh");
        auth = subscription.getKey("auth");
      } else {
        // Fallback for different subscription formats
        p256dh = subscription.keys?.p256dh;
        auth = subscription.keys?.auth;
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
