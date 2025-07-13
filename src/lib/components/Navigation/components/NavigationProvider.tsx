/**
 * NavigationProvider Component
 *
 * Provider component that renders children with navigation
 */

"use client";

import { NavigationContainer } from "./NavigationContainer";
import type { NavigationProviderProps } from "../types";

export function NavigationProvider({ children }: NavigationProviderProps) {
  return (
    <>
      {children}
      <NavigationContainer />
    </>
  );
}
