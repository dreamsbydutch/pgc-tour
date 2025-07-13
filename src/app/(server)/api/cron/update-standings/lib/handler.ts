/**
 * Handler for the update standings cron job
 */

import { createCaller, createTRPCContext } from "@pgc-server";
import { headers } from "next/headers";
import type { CronJobResult } from "./types";
import { updateStandingsOptimized } from "./service";

export async function handleUpdateStandingsCron(
  request: Request,
): Promise<CronJobResult> {
  try {
    // Security check (uncomment for production)
    // const cronSecret = process.env.CRON_SECRET;
    // if (cronSecret) {
    //   const providedSecret = request.headers.get("x-cron-secret");
    //   if (providedSecret !== cronSecret) {
    //     return { success: false, message: "Unauthorized", error: "Unauthorized", status: 401 };
    //   }
    // }

    const { searchParams, origin } = new URL(request.url);
    const next = searchParams.get("next") ?? "/";

    // Create a TRPC context with cron job authorization
    const requestHeaders = new Headers(headers());
    requestHeaders.set("x-cron-secret", process.env.CRON_SECRET ?? "");
    requestHeaders.set("x-trpc-source", "cron");

    const ctx = await createTRPCContext({
      headers: requestHeaders,
    });

    const api = createCaller(ctx);

    // Execute the standings update
    const result = await updateStandingsOptimized(api);

    if (result.seasonProcessed) {
      return {
        success: true,
        message: `Successfully updated standings for ${result.tourCardsUpdated} tour cards`,
        data: result,
        status: 200,
      };
    } else {
      return {
        success: false,
        message: "No current season found",
        data: result,
        status: 404,
      };
    }
  } catch (error) {
    console.error("❌ Error in update standings cron job:", error);
    return {
      success: false,
      message: "Failed to update standings",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    };
  }
}
