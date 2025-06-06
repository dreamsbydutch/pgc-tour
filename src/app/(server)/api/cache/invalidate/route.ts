import { NextResponse } from "next/server";
import { db } from "@/src/server/db";
import { z } from "zod";
import type { CacheInvalidation } from "@prisma/client";
import { log } from "@/src/lib/logging";

// Input validation schemas
const PostRequestSchema = z.object({
  source: z.string().optional().default("api"),
  type: z
    .enum(["global", "tourCards", "tournaments"])
    .optional()
    .default("global"),
});

// Response type interfaces
interface CacheInvalidationResponse {
  success: true;
  message: string;
  timestamp: number;
  source: string;
  type: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface CacheStatusResponse {
  status: string;
  latestInvalidation: {
    timestamp: number;
    source: string;
    type: string;
  } | null;
  latestTourCardInvalidation: {
    timestamp: number;
    source: string;
    type: string;
  } | null;
  latestTournamentInvalidation: {
    timestamp: number;
    source: string;
    type: string;
  } | null;
  message: string;
}

interface CacheStatusErrorResponse {
  error: string;
}

/**
 * Database-driven cache invalidation endpoint
 * Creates a cache invalidation record in the database
 */
export async function POST(
  request: Request,
): Promise<NextResponse<CacheInvalidationResponse | ErrorResponse>> {
  try {
    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        } satisfies ErrorResponse,
        { status: 400 },
      );
    }

    // Validate input data
    const validationResult = PostRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid input: ${validationResult.error.message}`,
        } satisfies ErrorResponse,
        { status: 400 },
      );
    }

    const { source, type } = validationResult.data;

    // Create cache invalidation record in database
    const invalidation: CacheInvalidation = await db.cacheInvalidation.create({
      data: {
        source,
        type,
        timestamp: new Date(),
        updatedAt: new Date(),
      },
    });

    log.cache.invalidate(type, source, { requestId: crypto.randomUUID() });

    return NextResponse.json({
      success: true,
      message: "Cache invalidation recorded in database",
      timestamp: invalidation.timestamp.getTime(),
      source: invalidation.source ?? "",
      type: invalidation.type,
    } satisfies CacheInvalidationResponse);
  } catch (error) {
    log.cache.error("Cache invalidation failed", error instanceof Error ? error : new Error(String(error)));

    const errorMessage =
      error instanceof Error
        ? `Database error: ${error.message}`
        : "Failed to record cache invalidation";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check latest cache invalidation by type
 */
export async function GET(): Promise<
  NextResponse<CacheStatusResponse | CacheStatusErrorResponse>
> {
  try {
    // Get latest invalidation for each type
    const [latestTourCards, latestTournaments]: [CacheInvalidation | null, CacheInvalidation | null] =
      await Promise.all([
        db.cacheInvalidation.findFirst({
          where: { type: "tourCards" },
          orderBy: { timestamp: "desc" },
        }),
        db.cacheInvalidation.findFirst({
          where: { type: "tournaments" },
          orderBy: { timestamp: "desc" },
        }),
      ]);

    // Also get the overall latest invalidation
    const latestOverall: CacheInvalidation | null = await db.cacheInvalidation.findFirst({
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      status: "active",
      latestInvalidation: latestOverall
        ? {
            timestamp: latestOverall.timestamp.getTime(),
            source: latestOverall.source ?? "",
            type: latestOverall.type,
          }
        : null,
      latestTourCardInvalidation: latestTourCards
        ? {
            timestamp: latestTourCards.timestamp.getTime(),
            source: latestTourCards.source ?? "",
            type: latestTourCards.type,
          }
        : null,
      latestTournamentInvalidation: latestTournaments
        ? {
            timestamp: latestTournaments.timestamp.getTime(),
            source: latestTournaments.source ?? "",
            type: latestTournaments.type,
          }
        : null,
      message: "Database-driven cache invalidation system with type support",
    } satisfies CacheStatusResponse);
  } catch (error) {
    log.cache.error("Error fetching cache status", error instanceof Error ? error : new Error(String(error)));

    const errorMessage =
      error instanceof Error
        ? `Database error: ${error.message}`
        : "Failed to fetch cache status";

    return NextResponse.json(
      {
        error: errorMessage,
      } satisfies CacheStatusErrorResponse,
      { status: 500 },
    );
  }
}
