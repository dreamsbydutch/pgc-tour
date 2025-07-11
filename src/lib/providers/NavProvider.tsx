"use client";

import type { ReactNode } from "react";
import NavBar from "@components/smartComponents/nav/NavBar";

export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}
