"use client";

import { useMainStore } from "@/src/lib/store/store";
import type { TourCard } from "@prisma/client";
import { AchievementIcon } from "./OptimizedImage";

export default function LittleFucker({ tourCard }: { tourCard: TourCard }) {
  const tier = useMainStore((state) => state.currentTiers)?.find(
    (t) => t.name === "Major",
  );
  const majors = useMainStore((store) => store.pastTournaments)?.filter(
    (t) =>
      (t.name === "RBC Canadian Open" || t.tierId === tier?.id) &&
      new Date(t.endDate) < new Date(),
  );
  return majors?.map((major) => {
    const champ = major.teams.find(
      (t) =>
        t.tourCardId === tourCard.id &&
        (t.position === "1" || t.position === "T1"),
    );
    if (!champ) return null;
    return (
      <AchievementIcon
        key={champ.id}
        src={
          major.name === "RBC Canadian Open"
            ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
            : (major.logoUrl ?? "")
        }
        alt="Major Champ Logo"
        className="mx-0.5 inline-block h-6 w-6"
      />
    );
  });
}
