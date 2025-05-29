"use client";

import { useInitStore } from "./useInitStore";

export function InitStoreWrapper({ children }: { children: React.ReactNode }) {
  useInitStore();
  return <>{children}</>;
}
