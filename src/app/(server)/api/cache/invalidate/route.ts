import { NextResponse } from "next/server";
import { db } from "@/src/server/db";
import { z } from "zod";

// Input validation schemas
const PostRequestSchema = z.object({
  source: z.string().optional().default("api"),
  type: z.string().optional().default("global"),
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
      source: invalidation.source ?? "",
      type: invalidation.type,
    } satisfies CacheInvalidationResponse);
  } catch (error) {
    console.error("Error creating cache invalidation:", error);

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
 * GET endpoint to check latest cache invalidation
 */
export async function GET(): Promise<
  NextResponse<CacheStatusResponse | CacheStatusErrorResponse>
> {
  try {
    const latestInvalidation = await db.cacheInvalidation.findFirst({
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      status: "active",
      latestInvalidation: latestInvalidation
        ? {
            timestamp: latestInvalidation.timestamp.getTime(),
            source: latestInvalidation.source ?? "",
            type: latestInvalidation.type,
          }
        : null,
      message: "Database-driven cache invalidation system",
    } satisfies CacheStatusResponse);
  } catch (error) {
    console.error("Error fetching cache status:", error);

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
