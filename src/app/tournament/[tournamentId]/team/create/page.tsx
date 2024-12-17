import { chooseGolfers, seedGolfers } from "@/src/server/api/actions/golfer";

export default function CrateTeamPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  return <div>{params.tournamentId}</div>;
}
