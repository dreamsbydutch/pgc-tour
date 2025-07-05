"use client";

import { ReactNode } from "react";
import NavBar from "@/src/lib/components/smartComponents/nav/NavBar";

export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  );
}
