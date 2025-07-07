"use client";
import { LeagueSchedule } from "@/lib/components/functionalComponents/client/LeagueSchedule";
import { LeagueScheduleError } from "../../functionalComponents/error/LeagueScheduleError";
import { useCurrentSchedule } from "@/lib/hooks";
import { LeagueScheduleSkeleton } from "../../functionalComponents/loading/LeagueScheduleSkeleton";

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
