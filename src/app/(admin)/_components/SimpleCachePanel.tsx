"use client";

import { useState } from "react";
import { Button } from "@/src/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/app/_components/ui/card";
import { Badge } from "@/src/app/_components/ui/badge";
import { initializeStore } from "@/src/lib/store/init";
import { resetStoreInitialization, resetLeaderboardInitialization } from "@/src/lib/hooks/useStore";
import { Trash2, RefreshCw, Database, Clock } from "lucide-react";
import { api } from "@/src/trpc/react";
import { useMainStore, useLeaderboardStore } from "@/src/lib/store/store";

export default function CacheManagementPanel() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Get real store state
  const mainStore = useMainStore();
  const leaderboardStore = useLeaderboardStore();
  
  // Calculate real cache info from store state
  const getCacheInfo = () => ({
    main: { 
      lastUpdated: mainStore._lastUpdated,
      hasData: {
        tournaments: !!(mainStore.seasonTournaments?.length),
        tourCards: !!(mainStore.tourCards?.length),
        tours: !!(mainStore.tours?.length),
        currentSeason: !!mainStore.currentSeason,
        tiers: !!(mainStore.currentTiers?.length)
      }
    },
    leaderboard: { 
      lastUpdated: leaderboardStore._lastUpdated,
      hasData: {
        teams: !!(leaderboardStore.teams?.length),
        golfers: !!(leaderboardStore.golfers?.length)
      }
    },
    timestamp: Date.now()
  });

  // Use the function to get current cache info
  const cacheInfo = getCacheInfo();

  const [cacheStatus, setCacheStatus] = useState({
    lastRefresh: Date.now(),
    isDatabaseDriven: true,
    lastTourCardRefresh: Date.now(),
    lastTournamentRefresh: Date.now(),
    authCoordinated: true,
    isRefreshing: false,
  });
  // Database cache invalidation queries
  const { data: latestInvalidation, refetch: refetchInvalidation } =
    api.cache.getLatestInvalidation.useQuery();
  const invalidateCache = api.cache.invalidateCache.useMutation({
    onSuccess: async () => {
      await refetchInvalidation();
    },
  });

  const handleAction = async (
    action: string,
    fn: () => Promise<void> | Promise<boolean> | void,
  ) => {
    setIsLoading(action);
    try {
      await fn();
      // Store will be updated automatically, no need to manually set cache info
      setCacheStatus({
        lastRefresh: Date.now(),
        isDatabaseDriven: true,
        lastTourCardRefresh: Date.now(),
        lastTournamentRefresh: Date.now(),
        authCoordinated: true,
        isRefreshing: false,
      });
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setIsLoading(null);
    }
  };
  // Database-driven cache invalidation handlers
  const handleDatabaseInvalidation = async () => {
    setIsLoading("invalidate-database");
    try {
      await invalidateCache.mutateAsync({
        source: "admin-panel",
        type: "global",
      });

      // Then force refresh the cache
      await initializeStore();

      // Update UI state
      setCacheStatus({
        lastRefresh: Date.now(),
        isDatabaseDriven: true,
        lastTourCardRefresh: Date.now(),
        lastTournamentRefresh: Date.now(),
        authCoordinated: true,
        isRefreshing: false,
      });
    } catch (error) {
      console.error("Error during database invalidation:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleTourCardInvalidation = async () => {
    setIsLoading("invalidate-tour-cards");
    try {
      await invalidateCache.mutateAsync({
        source: "admin-panel", 
        type: "tourCards",
      });
      await initializeStore();

      // Update UI state
      setCacheStatus({
        lastRefresh: Date.now(),
        isDatabaseDriven: true,
        lastTourCardRefresh: Date.now(),
        lastTournamentRefresh: Date.now(),
        authCoordinated: true,
        isRefreshing: false,
      });
    } catch (error) {
      console.error("Error during tour card invalidation:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleTournamentInvalidation = async () => {
    setIsLoading("invalidate-tournaments");
    try {
      await invalidateCache.mutateAsync({
        source: "admin-panel",
        type: "tournaments",
      });
      await initializeStore();

      // Update UI state
      setCacheStatus({
        lastRefresh: Date.now(),
        isDatabaseDriven: true,
        lastTourCardRefresh: Date.now(),
        lastTournamentRefresh: Date.now(),
        authCoordinated: true,
        isRefreshing: false,
      });
    } catch (error) {
      console.error("Error during tournament invalidation:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Manage application cache and data storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {" "}
        {/* Cache Status */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Cache Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  cacheInfo.main.hasData.tournaments
                    ? "default"
                    : "secondary"
                }
              >
                Main Store:{" "}
                {cacheInfo.main.hasData.tournaments ? "Loaded" : "Empty"}
              </Badge>
              <Badge
                variant={
                  cacheInfo.leaderboard.hasData.teams
                    ? "default"
                    : "secondary"
                }
              >
                Leaderboard:{" "}
                {cacheInfo.leaderboard.hasData.teams ? "Loaded" : "Empty"}
              </Badge>
              <Badge
                variant={cacheStatus.isDatabaseDriven ? "default" : "secondary"}
              >
                Cache Type:{" "}
                {cacheStatus.isDatabaseDriven ? "Database-Driven" : "Static"}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Database Invalidation</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {latestInvalidation ? (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Last:{" "}
                    {new Date(latestInvalidation.timestamp).toLocaleString()}
                  </div>
                  <div>Source: {latestInvalidation.source ?? "Unknown"}</div>
                  <div>Type: {latestInvalidation.type}</div>
                </>
              ) : (
                <div>No invalidation records found</div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Last Updated</h4>
            <p className="text-sm text-muted-foreground">
              {cacheInfo.main.lastUpdated
                ? new Date(cacheInfo.main.lastUpdated).toLocaleString()
                : "Never"}
            </p>
          </div>{" "}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Data Status</h4>
            <div className="space-y-1 text-sm">
              <div>
                Tournaments:{" "}
                {cacheInfo.main.hasData.tournaments ? "✓" : "✗"}
              </div>
              <div>
                Tour Cards: {cacheInfo.main.hasData.tourCards ? "✓" : "✗"}
              </div>
              <div>
                Teams: {cacheInfo.leaderboard.hasData.teams ? "✓" : "✗"}
              </div>
              <div>
                Golfers:{" "}
                {cacheInfo.leaderboard.hasData.golfers ? "✓" : "✗"}
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Quick Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Cache Invalidation</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDatabaseInvalidation}
              disabled={isLoading === "invalidate-database"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading === "invalidate-database"
                ? "Invalidating..."
                : "Refresh All Data"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTourCardInvalidation}
              disabled={isLoading === "invalidate-tour-cards"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading === "invalidate-tour-cards"
                ? "Refreshing..."
                : "Refresh Tour Cards"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTournamentInvalidation}
              disabled={isLoading === "invalidate-tournaments"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading === "invalidate-tournaments"
                ? "Refreshing..."
                : "Refresh Tournaments"}
            </Button>
          </div>
        </div>
        {/* Store Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Store Actions</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {" "}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDatabaseInvalidation}
              disabled={isLoading === "invalidate-database"}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isLoading === "invalidate-database"
                ? "Invalidating..."
                : "Invalidate & Refresh"}
            </Button>            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("reset-main", resetStoreInitialization)}
              disabled={isLoading === "reset-main"}
            >
              <Database className="mr-2 h-4 w-4" />
              {isLoading === "reset-main" ? "Resetting..." : "Reset Main Store"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction("reset-leaderboard", resetLeaderboardInitialization)
              }
              disabled={isLoading === "reset-leaderboard"}
            >
              <Database className="mr-2 h-4 w-4" />
              {isLoading === "reset-leaderboard"
                ? "Resetting..."
                : "Reset Leaderboard"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction("clear-storage", () => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.clear();
                    console.log('🗑️ All localStorage cleared');
                  }
                })
              }
              disabled={isLoading === "clear-storage"}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isLoading === "clear-storage" ? "Clearing..." : "Clear Storage"}
            </Button>
          </div>
        </div>
        {/* Emergency Actions */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium text-orange-600">
            Emergency Actions
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("dev-reset", () => {
                resetStoreInitialization();
                resetLeaderboardInitialization();
                if (typeof window !== 'undefined') {
                  window.localStorage.clear();
                }
                console.log('🔄 Complete development reset');
              })}
              disabled={isLoading === "dev-reset"}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isLoading === "dev-reset" ? "Resetting..." : "Full Reset"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use emergency actions only when the app is not functioning
            correctly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
