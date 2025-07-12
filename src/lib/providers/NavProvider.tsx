"use client";

import { NavBar } from "@pgc-components";
import type { ReactNode } from "react";

export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}
