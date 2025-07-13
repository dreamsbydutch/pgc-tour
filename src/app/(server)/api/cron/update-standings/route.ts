/**
 * UPDATE STANDINGS CRON JOB
 * ==========================
 *
 * Clean, focused cron job for updating tour card standings and positions.
 * Business logic is centralized in the services module with clear separation of concerns.
 *
 * BUSINESS RULES:
 * - Calculates statistics for each tour card (wins, top tens, earnings, etc.)
 * - Only includes teams that have completed more than 4 rounds
 * - Determines positions based on points earned
 * - Handles tied positions with "T" prefix
 *
 * ENDPOINTS:
 * - Production: https://www.pgctour.ca/api/cron/update-standings
 * - Development: http://localhost:3000/api/cron/update-standings
 */

import { NextResponse } from "next/server";
import { handleUpdateStandingsCron } from "./lib/handler";

export async function GET(request: Request) {
  // Add comprehensive logging for debugging production issues
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log("🔄 Update standings cron job started:", {
    timestamp,
    environment: process.env.NODE_ENV,
    hasCronSecret: !!process.env.CRON_SECRET,
    userAgent: request.headers.get("user-agent"),
    url: request.url,
  });

  try {
    const result = await handleUpdateStandingsCron(request);

    const duration = Date.now() - startTime;
    console.log("✅ Update standings cron job completed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      success: result.success,
      message: result.message,
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
    console.error("❌ Update standings cron job failed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update standings",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "X-Timestamp": timestamp,
          "X-Duration": `${duration}ms`,
        },
      },
    );
  }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
