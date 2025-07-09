import { LeagueSchedule } from "@/lib/components/smartComponents/functionalComponents/client/LeagueSchedule";
import { LeagueScheduleError } from "../functionalComponents/error/LeagueScheduleError";
import { getCurrentSchedule } from "@/server/actions/schedule";

export default async function CurrentSchedule() {
  try {
    const { tournaments } = await getCurrentSchedule();
    if (!tournaments.length) return null;
    return <LeagueSchedule tournaments={tournaments} />;
  } catch (error) {
    return <LeagueScheduleError error={error} />;
  }
}
