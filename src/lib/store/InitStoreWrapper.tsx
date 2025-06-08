"use client";

import { useInitStore } from "@/src/lib/hooks/useInitStore";
import EmergencyReset from "@/src/app/_components/EmergencyReset";
import { OptimizedImage } from "@/src/app/_components/OptimizedImage";
import { COMMON_IMAGES } from "@/src/lib/utils/image-optimization";

export function InitStoreWrapper({ children }: { children: React.ReactNode }) {
  const { 
    isLoading, 
    error, 
    retryCount, 
    forceRefresh, 
    retryInitialization 
  } = useInitStore();

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto flex animate-pulse items-center justify-center text-center font-varela text-3xl text-slate-600">
          <OptimizedImage
            src={COMMON_IMAGES.PGC_LOGO}
            alt="PGC Logo"
            width={96}
            height={96}
            className="mx-2"
            priority
            sizes="96px"
          />
          <div className="w-44 text-center">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : "Loading Clubhouse Data....."}
          </div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <EmergencyReset
            variant="card"
            message="Unable to load application data."
            size="lg"
          />
          <div className="flex justify-center space-x-2">            <button
              onClick={retryInitialization}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
            <button
              onClick={forceRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm"
            >
              Force Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
