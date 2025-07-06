"use client";

import { useCurrentSchedule } from "@/lib/hooks";
import { LeagueSchedule } from "@/lib/components/functionalComponents/LeagueSchedule";

/**
 * CurrentSchedule Component
 *
 * Displays the current season's tournament schedule using the LeagueSchedule component.
 * This is a smart component that fetches data using the useCurrentSchedule hook.
 */
export function CurrentSchedule() {
  const { tournaments, isLoading, error } = useCurrentSchedule();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg text-red-600">Error loading schedule</div>
      </div>
    );
  }

  if (!tournaments.length) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">No tournaments scheduled</div>
      </div>
    );
  }

  return <LeagueSchedule tournaments={tournaments} />;
}
