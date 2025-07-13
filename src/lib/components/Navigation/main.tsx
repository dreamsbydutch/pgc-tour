/**
 * NavigationProvider Component
 *
 * Provider component that renders children with navigation
 */

"use client";

import { NavigationContainer } from "./components/NavigationContainer";
import type { NavigationProviderProps } from "./utils/types";

export function NavigationProvider({ children }: NavigationProviderProps) {
  return (
    <>
      {children}
      <NavigationContainer />
    </>
  );
}
