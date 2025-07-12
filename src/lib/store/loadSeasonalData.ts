"use client";

import { useEffect } from "react";
import { useSeasonalStore } from "./seasonalStore";
import { api } from "@pgc-trpcClient";

/**
 * Loads and initializes all seasonal data into the store on first page load or when data is stale.
 * - Loads static data (season, tournaments, tiers, tours) and dynamic data (member, tourCard, allTourCards).
 * - Uses setSeasonalData for static data and setMember/setTourCard/setAllTourCards for dynamic data.
 * - Only updates the store if all queries succeed and data is stale.
 */
export function LoadSeasonalData() {
  const setSeasonalData = useSeasonalStore((s) => s.setSeasonalData);
  const setMember = useSeasonalStore((s) => s.setMember);
  const setTourCard = useSeasonalStore((s) => s.setTourCard);
  const setAllTourCards = useSeasonalStore((s) => s.setAllTourCards);
  const lastLoaded = useSeasonalStore((s) => s.lastLoaded);
  const isDataStale =
    lastLoaded === null || Date.now() - lastLoaded > 24 * 60 * 60 * 1000;
  const getDataAge = lastLoaded ? Date.now() - lastLoaded : 0;

  const seasonQuery = api.season.getCurrent.useQuery();
  const memberQuery = api.member.getSelf.useQuery();
  const tourCardQuery = api.tourCard.getSelfCurrent.useQuery();
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
    if (allLoaded && !hasErrors && isDataStale && storeDataQuery.data) {
      // Normalize tournament date fields to Date objects
      const normalizedTournaments = storeDataQuery.data.tournaments.map(
        (t) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
        }),
      );
      setSeasonalData({
        season: seasonQuery.data ?? null,
        tournaments: normalizedTournaments,
        tiers: storeDataQuery.data.tiers,
        tours: storeDataQuery.data.tours,
      });
      setMember(memberQuery.data!);
      setTourCard(tourCardQuery.data!);
      setAllTourCards(storeDataQuery.data.allTourCards);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Seasonal data loaded successfully");
      }
    }
  }, [
    allLoaded,
    hasErrors,
    isDataStale,
    setSeasonalData,
    setMember,
    setTourCard,
    setAllTourCards,
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
    seasonQuery.isError,
    memberQuery.isError,
    tourCardQuery.isError,
    storeDataQuery.isError,
  ]);

  // Log data age in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const ageMinutes = Math.round(getDataAge / 1000 / 60);
      if (ageMinutes > 0) {
        console.log(`📅 Seasonal data age: ${ageMinutes} minutes`);
      }
    }
  }, [getDataAge]);

  // Force reload when a tournament startDate or endDate passes
  useEffect(() => {
    const tournaments = storeDataQuery.data?.tournaments;
    if (!tournaments || tournaments.length === 0) return;
    const now = Date.now();
    // Find the next startDate or endDate in the future
    const nextTimestamp = tournaments
      .flatMap((t) => [
        new Date(t.startDate).getTime(),
        new Date(t.endDate).getTime(),
      ])
      .filter((ts) => ts > now)
      .sort((a, b) => a - b)[0];
    if (!nextTimestamp) return;
    const timeout = setTimeout(
      () => {
        // Invalidate the store by resetting lastLoaded (forces reload on next render)
        useSeasonalStore.getState().reset();
      },
      nextTimestamp - now + 1000,
    ); // Add 1s buffer
    return () => clearTimeout(timeout);
  }, [storeDataQuery.data?.tournaments]);

  return null;
}
