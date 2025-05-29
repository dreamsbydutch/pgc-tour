"use client"

import { useEffect } from "react";
import { useInitStore } from "./useInitStore";

export default function InitStoreWrapper({children}: {children: React.ReactNode}) {
    useEffect(() => {

        useInitStore();
    },[])
    return <>{children}</>

}