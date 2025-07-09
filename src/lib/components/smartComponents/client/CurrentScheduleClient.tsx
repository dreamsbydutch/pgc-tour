"use client";
import { LeagueSchedule } from "@/lib/components/smartComponents/functionalComponents/client/LeagueSchedule";
import { LeagueScheduleSkeleton } from "../functionalComponents/loading/LeagueScheduleSkeleton";
import { useCurrentSchedule } from "@/lib/hooks/hooks";

export default function CurrentSchedule() {
    const { tournaments, isLoading } = useCurrentSchedule();
    if (!tournaments.length) return null;
    if (isLoading) return <LeagueScheduleSkeleton />;
    return <LeagueSchedule tournaments={tournaments} />;
}
