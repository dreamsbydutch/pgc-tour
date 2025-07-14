"use client";

import { useEffect } from "react";

/**
 * SWMessageEvent interface
 *
 * Extends the standard MessageEvent to include optional type and url fields for service worker messages.
 */
interface SWMessageEvent extends MessageEvent {
  data: {
    type?: string;
    url?: string;
    [key: string]: unknown;
  };
}

/**
 * ServiceWorkerRegistration Component
 *
 * Registers the service worker, listens for updates and messages, requests persistent storage,
 * and checks for background sync support. This component does not render any UI.
 *
 * Usage: Place this component at the root of your app (e.g., in _app.tsx or a layout) to enable PWA features.
 */
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
      navigator.serviceWorker.addEventListener(
        "message",
        (event: SWMessageEvent) => {
          console.log("Message from SW:", event.data);

          if (event.data && event.data.type === "CACHE_UPDATED") {
            // Handle cache updates
            console.log("Cache updated for:", event.data.url);
          }
        },
      );

      // Add cache invalidation logic for when users return
      let isPageHidden = false;
      let lastActiveTime = Date.now();

      const handleVisibilityChange = () => {
        if (document.hidden) {
          isPageHidden = true;
          lastActiveTime = Date.now();
        } else if (isPageHidden) {
          const timeAway = Date.now() - lastActiveTime;

          // Only force update if user was away for more than 30 seconds
          if (timeAway > 30000) {
            console.log("User returned after being away for", timeAway, "ms");

            if (navigator.serviceWorker.controller) {
              // Force update cache
              navigator.serviceWorker.controller.postMessage({
                type: "FORCE_UPDATE",
              });
            }
          }
          isPageHidden = false;
        }
      };

      const handleOnline = () => {
        console.log("Back online");
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "FORCE_UPDATE",
          });
        }
      };

      const handleOffline = () => {
        console.log("Gone offline");
      };

      // Handle page focus/blur for desktop
      const handleFocus = () => {
        if (isPageHidden) {
          const timeAway = Date.now() - lastActiveTime;
          if (timeAway > 30000) {
            console.log("Window focused after being away for", timeAway, "ms");

            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "FORCE_UPDATE",
              });
            }
          }
          isPageHidden = false;
        }
      };

      const handleBlur = () => {
        isPageHidden = true;
        lastActiveTime = Date.now();
      };

      // Add event listeners
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);

      // Request persistent storage
      if ("storage" in navigator && "persist" in navigator.storage) {
        void navigator.storage.persist().then((persistent) => {
          console.log("Persistent storage:", persistent);
        });
      }

      // Register for background sync (if supported)
      void navigator.serviceWorker.ready.then((registration) => {
        if ("sync" in registration) {
          console.log("Background sync is supported");
        }
      });

      // Cleanup function
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
      };
    }
  }, []);

  // This component does not render any UI
  return null;
}
