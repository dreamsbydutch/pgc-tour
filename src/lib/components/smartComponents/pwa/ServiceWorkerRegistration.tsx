"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered successfully:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  console.log("New version available! Please refresh.");
                  // You could show a toast notification here
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Message from SW:", event.data);

        if (event.data.type === "CACHE_UPDATED") {
          // Handle cache updates
          console.log("Cache updated for:", event.data.url);
        }
      });

      // Request persistent storage
      if ("storage" in navigator && "persist" in navigator.storage) {
        navigator.storage.persist().then((persistent) => {
          console.log("Persistent storage:", persistent);
        });
      }

      // Register for background sync (if supported)
      navigator.serviceWorker.ready.then((registration) => {
        if ("sync" in registration) {
          console.log("Background sync is supported");
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
