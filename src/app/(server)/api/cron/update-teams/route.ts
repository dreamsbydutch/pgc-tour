/**
 * TEAM SCORING UPDATE CRON JOB
 * ============================
 *
 * Updates team scores for the current tournament based on golfer performance.
 *
 * BUSINESS RULES:
 * - Rounds 1-2: Use ALL golfers on the team for scoring
 * - Rounds 3-4: Use TOP 5 golfers based on individual round scores (if team has ≥5 golfers)
 * - Teams with <5 golfers in rounds 3-4 are marked as "CUT"
 *
 * EFFICIENCY OPTIMIZATIONS:
 * - Direct database access using Prisma instead of TRPC for batch operations
 * - Minimized API calls by batching all updates into single transactions
 * - Only updates changed fields to reduce database load
 */

import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { updateAllTeamsOptimized } from "./lib";

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  console.log("🔄 Team update cron job started:", {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasCronSecret: !!process.env.CRON_SECRET,
    userAgent: request.headers.get("user-agent"),
  });

  try {
    // Create a TRPC context with cron job authorization
    const requestHeaders = new Headers(headers());
    requestHeaders.set("x-cron-secret", process.env.CRON_SECRET ?? "");
    requestHeaders.set("x-trpc-source", "cron");

    const ctx = await createTRPCContext({
      headers: requestHeaders,
    });

    const api = createCaller(ctx);

    const tournament = (await api.tournament.getInfo()).current;
    if (!tournament) {
      console.log("❌ No current tournament found");
      return NextResponse.redirect(`${origin}/`);
    }

    // Use optimized update function that minimizes database calls
    const result = await updateAllTeamsOptimized(tournament);

    const duration = Date.now() - startTime;
    console.log("✅ Team update cron job completed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      success: result.success,
      teamsUpdated: result.teamsUpdated,
      fieldsUpdated: result.fieldsUpdated,
      databaseCalls: result.databaseCalls,
      tournamentName: tournament.name,
    });

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Team update cron job failed:", {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to update teams" },
      { status: 500 },
    );
  }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
