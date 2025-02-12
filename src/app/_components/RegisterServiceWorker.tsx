"use client";

import { useEffect } from "react";
import { registerAndSubscribe } from "./Push";

export default function RegisterServiceWorker() {
  useEffect(() => {
    console.log("Registering service worker...");
    registerAndSubscribe((subs) => {
      console.log("Subscription:", subs);
    });
    console.log("Service worker registered.");
  }, []);

  return null;
}
