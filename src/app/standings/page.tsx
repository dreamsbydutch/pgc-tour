import { api } from "@/src/trpc/server";
import LoadingSpinner from "../_components/LoadingSpinner";
import PGCStandings from "./_components/StandingsPage";

export default async function Page() {
  const member = await api.member.getSelf();
  const season = await api.season.getCurrent();
  const tours = await api.tour.getBySeason({
    seasonID: season?.id,
  });
  const tourCard = await api.tourCard.getByUserSeason({
    seasonId: season?.id,
    userId: member?.id,
  });
  const pgaTour = {
    id: "1",
    shortForm: "PGA",
    name: "PGA Tour",
    logoUrl: "",
    seasonId: season?.id ?? "",
    buyIn: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tourCards: [],
  };
  if (!tours || !member || !tourCard || !pgaTour) return <LoadingSpinner />;
  return <PGCStandings {...{ tours, tourCard }} />;
}
