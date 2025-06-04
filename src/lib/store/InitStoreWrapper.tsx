"use client";

import { useInitStore } from "./useInitStore";
import EmergencyReset from "@/src/app/_components/EmergencyReset";
import { OptimizedImage } from "@/src/app/_components/OptimizedImage";
import { COMMON_IMAGES } from "@/src/lib/utils/image-optimization";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthListener } from "@/src/lib/hooks/use-auth-listener";

// Separate component for search params logic that needs Suspense
function AuthSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const authSuccess = searchParams.get("auth_success");
    const timestamp = searchParams.get("timestamp");
    
    if (authSuccess === "true") {
      console.log("🔐 Authentication success detected, triggering store refresh...");
      
      // Clear the URL parameters first
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_success");
      url.searchParams.delete("timestamp");
      window.history.replaceState({}, "", url.toString());

      // Import resetInitialization dynamically to avoid circular imports
      import("./useInitStore").then(({ resetInitialization }) => {
        // Add a small delay to ensure session cookies are set
        setTimeout(() => {
          console.log("🔄 Triggering store refresh after successful authentication");
          resetInitialization();
        }, 1000); // 1 second delay to allow session propagation
      }).catch((error) => {
        console.error("❌ Failed to import resetInitialization:", error);
      });

      console.log("✅ URL params cleared and store refresh scheduled");
    }
  }, [searchParams]);

  return null;
}

export function InitStoreWrapper({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useInitStore();
  const authListener = useAuthListener();

  // Debug logging
  console.log("🔍 InitStoreWrapper render:", { isLoading, error: !!error });

  // Mark initialization state for auth listener
  useEffect(() => {
    authListener.setInitializing(isLoading);
  }, [isLoading, authListener]);

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
          <div className="w-44 text-center">Loading Clubhouse Data.....</div>
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
  // Render children if no loading or error
  console.log("✅ Rendering children");
  return (
    <>
      <Suspense fallback={null}>
        <AuthSuccessHandler />
      </Suspense>
      {children}
    </>
  );
}
