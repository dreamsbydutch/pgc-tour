/**
 * CREATE GROUPS HANDLER
 * =====================
 *
 * HTTP request handler for the create-groups cron job endpoint.
 * Handles request validation, cron authorization, and response formatting.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createTournamentGroups } from "./service";

/**
 * Main handler for create-groups requests
 */
export async function handleCreateGroups(
  request: NextRequest,
): Promise<NextResponse> {
  const { origin } = new URL(request.url);
  const startTime = Date.now();

  try {
    // Create headers with cron authorization
    const requestHeaders = new Headers(headers());
    requestHeaders.set("x-cron-secret", process.env.CRON_SECRET ?? "");
    requestHeaders.set("x-trpc-source", "cron");

    // Execute group creation
    const result = await createTournamentGroups(requestHeaders);

    // Log performance
    const duration = Date.now() - startTime;
    console.log(`✅ Create groups completed in ${duration}ms`, {
      success: result.success,
      groupsCreated: result.groupsCreated,
      golfersProcessed: result.golfersProcessed,
      message: result.message,
    });

    // Handle different result scenarios
    if (!result.success) {
      if (result.message.includes("already has golfers")) {
        // Redirect to next step if groups already exist
        return NextResponse.redirect(`${origin}/cron/update-golfers`);
      }

      if (result.message.includes("No upcoming tournament")) {
        // Redirect to home if no tournament
        return NextResponse.redirect(`${origin}/`);
      }

      // Return error for other failures
      return NextResponse.json(
        {
          error: result.message,
          details: result.error,
        },
        { status: 500 },
      );
    }

    // Success - redirect to next cron job
    return NextResponse.redirect(`${origin}/cron/update-golfers`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Create groups failed after ${duration}ms:`, error);

    return NextResponse.json(
      {
        error: "Failed to create groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Validate cron request authorization
 */
export function validateCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("⚠️ CRON_SECRET not configured");
    return false;
  }

  const authHeader = request.headers.get("x-cron-secret");
  return authHeader === cronSecret;
}
