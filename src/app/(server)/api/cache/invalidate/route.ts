import { NextResponse } from "next/server";
import { db } from "@/src/server/db";

/**
 * Database-driven cache invalidation endpoint
 * Creates a cache invalidation record in the database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = body.source ?? "api";
    const type = body.type ?? "global";

    // Create cache invalidation record in database
    const invalidation = await db.cacheInvalidation.create({
      data: {
        source,
        type,
        timestamp: new Date(),
      },
    });

    console.log(
      `🔄 Cache invalidation created: ${type} from ${source} at ${invalidation.timestamp.toISOString()}`,
    );

    return NextResponse.json({
      success: true,
      message: "Cache invalidation recorded in database",
      timestamp: invalidation.timestamp.getTime(),
      source: invalidation.source,
      type: invalidation.type,
    });
  } catch (error) {
    console.error("Error creating cache invalidation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record cache invalidation",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check latest cache invalidation
 */
export async function GET() {
  try {
    const latestInvalidation = await db.cacheInvalidation.findFirst({
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      status: "active",
      latestInvalidation: latestInvalidation
        ? {
            timestamp: latestInvalidation.timestamp.getTime(),
            source: latestInvalidation.source,
            type: latestInvalidation.type,
          }
        : null,
      message: "Database-driven cache invalidation system",
    });
  } catch (error) {
    console.error("Error fetching cache status:", error);
    return NextResponse.json(
      { error: "Failed to fetch cache status" },
      { status: 500 },
    );
  }
}
