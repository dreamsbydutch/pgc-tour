/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { api } from "@/src/trpc/react";
import { useTourCards, useCurrentSeason, useCache } from "@/src/lib/store";

export default function TourCardsDebug() {
  // Direct API calls
  const seasonQuery = api.season.getCurrent.useQuery();
  const tourCardsQuery = api.tourCard.getBySeason.useQuery(
    { seasonId: seasonQuery.data?.id ?? "" },
    { enabled: !!seasonQuery.data?.id },
  );
  // Store hooks
  const {
    season,
    loading: seasonLoading,
    error: seasonError,
  } = useCurrentSeason();
  const {
    tourCards,
    loading: tourCardsLoading,
    error: tourCardsError,
  } = useTourCards();
  const { invalidateAll } = useCache();

  return (
    <div className="m-4 rounded bg-gray-100 p-4">
      <h2 className="mb-4 text-xl font-bold">Tour Cards Debug</h2>
      <div className="mb-4">
        <button
          onClick={invalidateAll}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Clear All Cache
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold">Direct API Calls</h3>
          <div className="text-sm">
            <p>Season Query:</p>
            <p>Loading: {seasonQuery.isLoading ? "true" : "false"}</p>
            <p>Error: {seasonQuery.error?.message ?? "none"}</p>
            <p>Data: {JSON.stringify(seasonQuery.data, null, 2)}</p>

            <p className="mt-2">Tour Cards Query:</p>
            <p>Loading: {tourCardsQuery.isLoading ? "true" : "false"}</p>
            <p>Error: {tourCardsQuery.error?.message ?? "none"}</p>
            <p>Data Length: {tourCardsQuery.data?.length ?? 0}</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Store Hooks</h3>
          <div className="text-sm">
            <p>Season Hook:</p>
            <p>Loading: {seasonLoading ? "true" : "false"}</p>
            <p>Error: {seasonError ?? "none"}</p>
            <p>Data: {JSON.stringify(season, null, 2)}</p>

            <p className="mt-2">Tour Cards Hook:</p>
            <p>Loading: {tourCardsLoading ? "true" : "false"}</p>
            <p>Error: {tourCardsError ?? "none"}</p>
            <p>Data Length: {tourCards?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
