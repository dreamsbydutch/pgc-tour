"use client";

import type { ReactNode } from "react";
import { NavBar } from "@components/index";

export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}
