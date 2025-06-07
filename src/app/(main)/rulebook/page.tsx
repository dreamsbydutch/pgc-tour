"use client";

import { RulebookMainView } from "./views";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

/**
 * RulebookPage Component
 *
 * Displays the rulebook for the PGC Tour.
 * - Includes sections for schedule, rosters, scoring, playoffs, and payouts.
 * - Uses the refactored component structure for better organization.
 */
export default function RulebookPage() {
  return <RulebookMainView />;
}
