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

  // Check if different data types are stale
  const isStaticDataStale =
    !lastLoaded?.staticData ||
    Date.now() - lastLoaded.staticData > 5 * 24 * 60 * 60 * 1000;
  const isTourCardDataStale =
    !lastLoaded?.tourCard ||
    Date.now() - lastLoaded.tourCard > 24 * 60 * 60 * 1000; // 5 minutes
  const isAllTourCardsDataStale =
    !lastLoaded?.allTourCards ||
    Date.now() - lastLoaded.allTourCards > 24 * 60 * 60 * 1000; // 5 minutes

  const getDataAge = lastLoaded?.staticData
    ? Date.now() - lastLoaded.staticData
    : 0;

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

  // Check server-side timestamp for tourCard updates
  const lastTourCardsUpdateQuery = api.store.getLastTourCardsUpdate.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    {
      enabled: !!seasonQuery.data?.id,
      retry: 3,
      retryDelay: 1000,
      staleTime: 30 * 1000, // 30 seconds - check server timestamp more frequently
      gcTime: 2 * 60 * 1000, // 2 minutes
    },
  );

  // Check if tourCard data is stale based on server timestamp
  const isServerTourCardDataStale = (() => {
    if (!lastTourCardsUpdateQuery.data?.lastUpdated) return false;
    if (!lastLoaded?.tourCard) return true;

    const serverTimestamp = new Date(
      lastTourCardsUpdateQuery.data.lastUpdated,
    ).getTime();
    const localTimestamp = lastLoaded.tourCard;

    return serverTimestamp > localTimestamp;
  })();

  // Check if allTourCards data is stale based on server timestamp
  const isServerAllTourCardsDataStale = (() => {
    if (!lastTourCardsUpdateQuery.data?.lastUpdated) return false;
    if (!lastLoaded?.allTourCards) return true;

    const serverTimestamp = new Date(
      lastTourCardsUpdateQuery.data.lastUpdated,
    ).getTime();
    const localTimestamp = lastLoaded.allTourCards;

    return serverTimestamp > localTimestamp;
  })();

  // Combine server-side and time-based staleness checks
  const finalIsTourCardDataStale =
    isTourCardDataStale || isServerTourCardDataStale;
  const finalIsAllTourCardsDataStale =
    isAllTourCardsDataStale || isServerAllTourCardsDataStale;

  const allLoaded =
    !seasonQuery.isLoading &&
    !memberQuery.isLoading &&
    !tourCardQuery.isLoading &&
    !storeDataQuery.isLoading &&
    !lastTourCardsUpdateQuery.isLoading;

  const hasErrors =
    seasonQuery.isError ||
    memberQuery.isError ||
    tourCardQuery.isError ||
    storeDataQuery.isError ||
    lastTourCardsUpdateQuery.isError;

  useEffect(() => {
    // Load static data if it's stale
    if (allLoaded && !hasErrors && isStaticDataStale && storeDataQuery.data) {
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
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Static seasonal data loaded successfully");
      }
    }

    // Load member data if needed
    if (memberQuery.data) {
      setMember(memberQuery.data);
    }

    // Load tour card data if it's stale
    if (tourCardQuery.data && finalIsTourCardDataStale) {
      setTourCard(tourCardQuery.data);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Tour card data loaded successfully");
      }
    }

    // Load all tour cards data if it's stale
    if (storeDataQuery.data?.allTourCards && finalIsAllTourCardsDataStale) {
      setAllTourCards(storeDataQuery.data.allTourCards);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ All tour cards data loaded successfully");
      }
    }
  }, [
    allLoaded,
    hasErrors,
    isStaticDataStale,
    finalIsTourCardDataStale,
    finalIsAllTourCardsDataStale,
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
      if (lastTourCardsUpdateQuery.isError)
        console.error(
          "Last tour cards update query error:",
          lastTourCardsUpdateQuery.error,
        );
      console.groupEnd();
    }
  }, [
    hasErrors,
    seasonQuery.error,
    memberQuery.error,
    tourCardQuery.error,
    storeDataQuery.error,
    lastTourCardsUpdateQuery.error,
    seasonQuery.isError,
    memberQuery.isError,
    tourCardQuery.isError,
    storeDataQuery.isError,
    lastTourCardsUpdateQuery.isError,
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
