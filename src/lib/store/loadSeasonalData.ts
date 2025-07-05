"use client";

import { useEffect } from "react";
import { useSeasonalStore } from "@/lib/store/seasonalStore";
import { api } from "@/src/trpc/react";

export function LoadSeasonalData() {
  const setSeasonalData = useSeasonalStore((s) => s.setSeasonalData);
  const lastLoaded = useSeasonalStore((s) => s.lastLoaded);

  const seasonQuery = api.season.getCurrent.useQuery();
  const memberQuery = api.member.getSelf.useQuery();
  const tourCardQuery = api.tourCard.getSelfCurrent.useQuery();
  const allTourCardsQuery = api.tourCard.getBySeason.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    { enabled: !!seasonQuery.data?.id },
  );
  const tournamentsQuery = api.tournament.getBySeason.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    { enabled: !!seasonQuery.data?.id },
  );
  const tiersQuery = api.tier.getBySeason.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    { enabled: !!seasonQuery.data?.id },
  );
  const toursQuery = api.tour.getBySeason.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    { enabled: !!seasonQuery.data?.id },
  );

  const allLoaded =
    !seasonQuery.isLoading &&
    !memberQuery.isLoading &&
    !tourCardQuery.isLoading &&
    !allTourCardsQuery.isLoading &&
    !tournamentsQuery.isLoading &&
    !tiersQuery.isLoading &&
    !toursQuery.isLoading;

  useEffect(() => {
    const isStale =
      !lastLoaded || Date.now() - lastLoaded > 1000 * 60 * 60 * 24; // 24 hours

    if (allLoaded && isStale) {
      setSeasonalData({
        season: seasonQuery.data,
        member: memberQuery.data,
        tourCard: tourCardQuery.data,
        allTourCards: allTourCardsQuery.data,
        tournaments: tournamentsQuery.data,
        tiers: tiersQuery.data,
        tours: toursQuery.data,
      });
    }
  }, [allLoaded]);

  return null;
}
