"use client"

import { useInitLeaderboardStore, useInitStore } from "./useInitStore";

export default function InitStoreWrapper({ children }: { children: React.ReactNode }) {
    useInitStore();
    useInitLeaderboardStore()
    return <>{children}</>

}