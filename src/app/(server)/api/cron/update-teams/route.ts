/**
 * TEAM UPDATE CRON JOB
 * =====================
 *
 * Clean, focused cron job for updating team scores and positions.
 * Business logic is centralized in the services module with clear separation of concerns.
 *
 * ENDPOINTS:
 * - Production: https://www.pgctour.ca/api/cron/update-teams
 * - Development: http://localhost:3000/api/cron/update-teams
 */

import { NextResponse } from "next/server";
import { handleTeamUpdateCron } from "./lib/handler";

export async function GET(request: Request) {
  // Add comprehensive logging for debugging production issues
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log("🔄 Team update cron job started:", {
    timestamp,
    environment: process.env.NODE_ENV,
    hasCronSecret: !!process.env.CRON_SECRET,
    userAgent: request.headers.get("user-agent"),
    url: request.url,
  });

  try {
    const result = await handleTeamUpdateCron(request);

    const duration = Date.now() - startTime;
    console.log("✅ Team update cron job completed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result: result ? "Success" : "Failed",
    });

    // Return with cache-busting headers
    return new Response(JSON.stringify(result), {
      status: result.status ?? 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Timestamp": timestamp,
        "X-Duration": `${duration}ms`,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Team update cron job failed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
