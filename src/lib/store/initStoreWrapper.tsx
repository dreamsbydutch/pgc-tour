"use client"

import { useEffect } from "react";
import { useInitStore } from "./useInitStore";

export default function InitStoreWrapper({children}: {children: React.ReactNode}) {
        useInitStore();
    return <>{children}</>

}