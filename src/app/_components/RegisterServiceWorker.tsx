"use client";

import { useEffect } from "react";
import { registerAndSubscribe } from "./Push";

export default function RegisterServiceWorker() {
  useEffect(() => {
    registerAndSubscribe((subs) => {
      console.log("Subscription:", subs);
    });
  }, []);

  return null;
}
