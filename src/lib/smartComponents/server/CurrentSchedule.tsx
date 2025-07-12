import { LeagueSchedule } from "@pgc-components";
import { getCurrentSchedule } from "@pgc-serverActions";

export default async function CurrentSchedule() {
  const { tournaments } = await getCurrentSchedule();
  if (!tournaments.length) return null;
  return <LeagueSchedule tournaments={tournaments} />;
}
