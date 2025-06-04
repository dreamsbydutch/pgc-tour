"use client";

import { useInitStore } from "@/src/lib/hooks/useInitStore";
import EmergencyReset from "@/src/app/_components/EmergencyReset";
import { OptimizedImage } from "@/src/app/_components/OptimizedImage";
import { COMMON_IMAGES } from "@/src/lib/utils/image-optimization";
import { useAuth } from "@/src/lib/auth/AuthContext";
// Removed unused imports

export function InitStoreWrapper({ children }: { children: React.ReactNode }) {
  const { 
    isLoading, 
    error, 
    retryCount, 
    isInitialized,
    forceRefresh, 
    retry 
  } = useInitStore();
  const { isAuthenticated, member } = useAuth();

  // Debug logging with enhanced info
  console.log("🔍 InitStoreWrapper render:", { 
    isLoading, 
    error: !!error, 
    retryCount,
    isInitialized,
    isAuthenticated, 
    memberEmail: member?.email 
  });

  // Show loading state while initializing
  if (isLoading) {
    console.log("⏳ Showing loading state");
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto flex animate-pulse items-center justify-center text-center font-varela text-3xl text-slate-600">
          <OptimizedImage
            src={COMMON_IMAGES.PGC_LOGO}
            alt="PGC Logo"
            width={96}
            height={96}
            className="mx-2"
            priority={true}
            sizes="96px"
          />
          <div className="w-44 text-center">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : "Loading Clubhouse Data....."}
          </div>
        </div>
      </div>
    );
  }

  // Show emergency reset for critical errors
  if (error && !isLoading) {
    console.log("❌ Showing error state:", error);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <EmergencyReset
            variant="card"
            message="Unable to load application data. This could be a network issue or corrupted cache."
            size="lg"
          />
          <div className="mt-4 space-y-3">
            <div className="flex justify-center space-x-2">
              <button
                onClick={retry}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
              <button
                onClick={forceRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Force Refresh
              </button>
            </div>
            <div className="text-center">
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer">Technical Details</summary>
                <p className="mt-2 rounded bg-gray-100 p-2 text-left font-mono text-xs">
                  {error}
                </p>
                {retryCount > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Retry attempts: {retryCount}/3
                  </p>
                )}
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render children if no loading or error
  console.log("✅ Rendering children");
  return children;
}
