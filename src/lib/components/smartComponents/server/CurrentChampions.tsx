import { ChampionSectionSkeleton } from "../../functionalComponents/loading/ChampionsPopupSkelton";
import { getLatestChampions } from "@/server/api/actions/champions";
import { hasItems } from "@/lib/utils/main";
import { ChampionsPopup } from "../../functionalComponents/client/ChampionsPopup";

export default async function CurrentChampions() {
  const { tournament, champs } = await getLatestChampions();
  if (!tournament) return null;
  if (!hasItems(champs)) return <ChampionSectionSkeleton />;
  return <ChampionsPopup tournament={tournament} champs={champs} />;
}
