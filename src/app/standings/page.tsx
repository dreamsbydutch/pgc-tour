import { api } from "@/src/trpc/server";
import LoadingSpinner from "../_components/LoadingSpinner";
import PGCStandings from "./_views/StandingsPage";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const member = await api.member.getSelf();
  const tours = await api.tour.getActive();
  if (!tours) return <LoadingSpinner />;
  return (
    <PGCStandings {...{ tours, member, inputTour: searchParams.tour }} />
  );
}
