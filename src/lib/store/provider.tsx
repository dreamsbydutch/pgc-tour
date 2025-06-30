"use client";

import React, { useEffect } from "react";
import { usePGCTourStore } from "./store";

interface PGCTourStoreProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes the store on client side
 * This ensures proper SSR handling and auth initialization
 */
export function PGCTourStoreProvider({ children }: PGCTourStoreProviderProps) {
  const initializeAuth = usePGCTourStore((state) => state.initializeAuth);
  const cleanup = usePGCTourStore((state) => state.cleanup);

  useEffect(() => {
    // Initialize auth when the provider mounts (client-side only)
    initializeAuth();

    // Cleanup when component unmounts
    return () => {
      cleanup();
    };
  }, [initializeAuth, cleanup]);

  return <>{children}</>;
}
