"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { initializeStore } from "@/src/lib/store/init";
import { useMainStore } from "@/src/lib/store/store";

export default function FloatingResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasStoreError, setHasStoreError] = useState(false);
  const [isStoreLoading, setIsStoreLoading] = useState(true);

  // Check store state for errors or loading issues
  const storeState = useMainStore();
  useEffect(() => {
    // Check if store has basic data loaded
    const hasBasicData = storeState.tours && storeState.seasonTournaments;
    const cacheAge = storeState._lastUpdated
      ? Date.now() - storeState._lastUpdated
      : null;
    const cacheVeryOld = cacheAge && cacheAge > 1000 * 60 * 60 * 24 * 2; // 2 days

    // Check for error conditions
    const errorCondition = !hasBasicData || !!cacheVeryOld;

    setHasStoreError(errorCondition);
    setIsStoreLoading(!storeState._lastUpdated);
  }, [storeState]);

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }    setIsResetting(true);
    try {
      await initializeStore();
      // Small delay to show completion before page potentially refreshes
      setTimeout(() => {
        setIsResetting(false);
        setShowConfirm(false);
      }, 500);
    } catch (error) {
      console.error("Reset failed:", error);
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Determine button appearance based on state
  const getButtonVariant = () => {
    if (showConfirm) return "destructive";
    if (hasStoreError) return "destructive";
    return "outline";
  };

  const getButtonSize = () => {
    if (hasStoreError) return "default";
    return "sm";
  };

  const shouldShowPermanently = hasStoreError || isStoreLoading;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 transition-opacity duration-300 ${
        shouldShowPermanently ? "opacity-100" : "opacity-30 hover:opacity-100"
      }`}
    >
      {showConfirm && (
        <div className="max-w-xs rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm text-gray-700">
            {hasStoreError
              ? "There seems to be a loading issue. Reset all cached data?"
              : "Reset all cached data and reload fresh content?"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Reset"
              )}
            </Button>
          </div>
        </div>
      )}

      <Button
        size={getButtonSize()}
        variant={getButtonVariant()}
        className={`rounded-full shadow-lg transition-all duration-200 hover:shadow-xl ${
          hasStoreError ? "h-12 animate-pulse px-4" : "h-10 w-10 p-0"
        }`}
        onClick={handleReset}
        disabled={isResetting}
        title={
          hasStoreError
            ? "Store loading error - Click to reset"
            : showConfirm
              ? "Confirm reset"
              : "Reset cached data"
        }
      >
        {isResetting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasStoreError ? (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span className="text-sm">Reset</span>
          </>
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
