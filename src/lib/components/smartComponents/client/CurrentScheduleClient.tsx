"use client";
import { LeagueSchedule } from "@/lib/components/functionalComponents/client/LeagueSchedule";
import { LeagueScheduleError } from "../../functionalComponents/error/LeagueScheduleError";
import { LeagueScheduleSkeleton } from "../../functionalComponents/loading/LeagueScheduleSkeleton";
import { useCurrentSchedule } from "@/lib/hooks/hooks";

export default function CurrentSchedule() {
  try {
    const { tournaments, isLoading } = useCurrentSchedule();
    if (!tournaments.length) return null;
    if (isLoading) return <LeagueScheduleSkeleton />;
    return <LeagueSchedule tournaments={tournaments} />;
  } catch (error) {
    return <LeagueScheduleError error={error} />;
  }
}
