"use client";

import { useEffect } from "react";
import { useSeasonalStore } from "@/lib/store/seasonalStore";
import { api } from "@/src/trpc/react";

export function LoadSeasonalData() {
  const clearAndSet = useSeasonalStore((s) => s.clearAndSet);
  const isDataStale = useSeasonalStore((s) => s.isDataStale);
  const getDataAge = useSeasonalStore((s) => s.getDataAge);

  const seasonQuery = api.season.getCurrent.useQuery();
  const memberQuery = api.member.getSelf.useQuery();
  const tourCardQuery = api.tourCard.getSelfCurrent.useQuery();

  // Use optimized store route for minimal data
  const storeDataQuery = api.store.getSeasonalData.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    {
      enabled: !!seasonQuery.data?.id,
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    },
  );

  const allLoaded =
    !seasonQuery.isLoading &&
    !memberQuery.isLoading &&
    !tourCardQuery.isLoading &&
    !storeDataQuery.isLoading;

  const hasErrors =
    seasonQuery.isError ||
    memberQuery.isError ||
    tourCardQuery.isError ||
    storeDataQuery.isError;

  useEffect(() => {
    // Only update if data is stale and all queries succeeded
    if (allLoaded && !hasErrors && isDataStale() && storeDataQuery.data) {
      console.log("🔄 Loading fresh seasonal data...");

      // Use clearAndSet to prevent quota issues
      clearAndSet({
        season: seasonQuery.data,
        member: memberQuery.data,
        tourCard: tourCardQuery.data,
        allTourCards: storeDataQuery.data.allTourCards,
        tournaments: storeDataQuery.data.tournaments,
        tiers: storeDataQuery.data.tiers,
        tours: storeDataQuery.data.tours,
      });

      console.log("✅ Seasonal data loaded successfully");
    }
  }, [
    allLoaded,
    hasErrors,
    isDataStale,
    clearAndSet,
    seasonQuery.data,
    memberQuery.data,
    tourCardQuery.data,
    storeDataQuery.data,
  ]);

  // Log errors in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && hasErrors) {
      console.group("❌ Seasonal Data Load Errors");
      if (seasonQuery.isError)
        console.error("Season query error:", seasonQuery.error);
      if (memberQuery.isError)
        console.error("Member query error:", memberQuery.error);
      if (tourCardQuery.isError)
        console.error("Tour card query error:", tourCardQuery.error);
      if (storeDataQuery.isError)
        console.error("Store data query error:", storeDataQuery.error);
      console.groupEnd();
    }
  }, [
    hasErrors,
    seasonQuery.error,
    memberQuery.error,
    tourCardQuery.error,
    storeDataQuery.error,
  ]);

  // Log data age in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const ageMinutes = Math.round(getDataAge() / 1000 / 60);
      if (ageMinutes > 0) {
        console.log(`📅 Seasonal data age: ${ageMinutes} minutes`);
      }
    }
  }, [getDataAge]);

  return null;
}
