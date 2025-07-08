import { ChampionSectionSkeleton } from "../../functionalComponents/loading/ChampionsPopupSkelton";
import { hasItems } from "@/lib/utils/main";
import { ChampionsPopup } from "../../functionalComponents/client/ChampionsPopup";
import { getRecentChampions } from "@/server/actions/champions";

export default async function CurrentChampions() {
  const { tournament, champions } = await getRecentChampions();
  if (!tournament) return null;
  if (!hasItems(champions)) return <ChampionSectionSkeleton />;
  return <ChampionsPopup tournament={tournament} champs={champions} />;
}
