"use client";

import { useEffect } from 'react';
import { useSeasonalStore } from '@/lib/store/seasonalStore';
import { api } from '@/src/trpc/react';

export function LoadSeasonalData() {
  const setSeasonalData = useSeasonalStore((s) => s.setSeasonalData);
  const lastLoaded = useSeasonalStore((s) => s.lastLoaded);

  const memberQuery = api.member.getSelf.useQuery();
  const tourCardQuery = api.tourCard.getSelfCurrent.useQuery();
  const allTourCardsQuery = api.tourCard.getAll.useQuery();
  const tournamentsQuery = api.tournament.getAll.useQuery();
  const tiersQuery = api.tier.getAll.useQuery();
  const toursQuery = api.tour.getAll.useQuery();

  const allLoaded =
    !memberQuery.isLoading &&
    !tourCardQuery.isLoading &&
    !allTourCardsQuery.isLoading &&
    !tournamentsQuery.isLoading &&
    !tiersQuery.isLoading &&
    !toursQuery.isLoading;

  useEffect(() => {
    const isStale = !lastLoaded || Date.now() - lastLoaded > 1000 * 60 * 60 * 24; // 24 hours

    if (allLoaded && isStale) {
      setSeasonalData({
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