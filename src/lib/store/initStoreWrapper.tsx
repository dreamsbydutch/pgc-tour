"use client"

import { useInitStore } from "./useInitStore";

export default function InitStoreWrapper({children}: {children: React.ReactNode}) {
        useInitStore();
    return <>{children}</>

}