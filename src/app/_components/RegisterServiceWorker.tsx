"use client";

import { useEffect } from "react";
import { registerAndSubscribe } from "./Push";
import { api } from "@/src/trpc/react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    const member = api.member.getSelf.useQuery().data;
    console.log("Registering service worker...");
    registerAndSubscribe((subs, member) => {
      console.log("Subscription:", subs);
    });
    console.log("Service worker registered.");
  }, []);

  return null;
}
