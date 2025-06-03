"use client";

import { useInitStore } from "./useInitStore";
import EmergencyReset from "@/src/app/_components/EmergencyReset";

export function InitStoreWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useInitStore();

  // Show emergency reset for critical errors
  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <EmergencyReset
            variant="card"
            message="Unable to load application data. This could be a network issue or corrupted cache."
            size="lg"
          />
          <div className="mt-4 text-center">
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer">Technical Details</summary>
              <p className="mt-2 rounded bg-gray-100 p-2 text-left font-mono text-xs">
                {error}
              </p>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
