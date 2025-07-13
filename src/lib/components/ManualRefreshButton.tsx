/**
 * @fileoverview Manual Refresh Button Component
 * Demonstrates how to use the manual refresh functionality for tour card data.
 * This component shows the server update status and provides a refresh button.
 */

"use client";

import {
  useManualRefresh,
  useIsTourCardDataStale,
} from "../store/seasonalStoreHooks";
import { useState } from "react";

export function ManualRefreshButton() {
  const { refreshTourCards } = useManualRefresh();
  const { isStale, lastServerUpdate, isLoading, error } =
    useIsTourCardDataStale();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTourCards();
    } catch (error) {
      console.error("Error refreshing tour cards:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span>Error checking for updates</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded bg-red-100 px-3 py-1 text-red-600 hover:bg-red-200 disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
        className={`rounded px-4 py-2 font-medium transition-colors ${
          isStale
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isRefreshing ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Refreshing...
          </span>
        ) : (
          <>
            Refresh Tour Cards
            {isStale && (
              <span className="ml-2 rounded bg-blue-400 px-2 py-1 text-xs text-white">
                Update Available
              </span>
            )}
          </>
        )}
      </button>

      {lastServerUpdate && (
        <div className="text-sm text-gray-500">
          Last updated: {new Date(lastServerUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * import { ManualRefreshButton } from '@/components/ManualRefreshButton';
 *
 * function MyPage() {
 *   return (
 *     <div>
 *       <h1>Tour Card Standings</h1>
 *       <ManualRefreshButton />
 *       // ... rest of your component
 *     </div>
 *   );
 * }
 * ```
 */
