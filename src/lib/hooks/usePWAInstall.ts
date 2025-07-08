/**
 * @file usePWAInstall.ts
 * @description
 *   React hook for managing Progressive Web App (PWA) installation prompts and state.
 *   Detects installability, handles the install prompt, and tracks installation status.
 *
 *   Usage:
 *     - usePWAInstall(): Returns installability, installation status, and a handler to trigger install prompt.
 *
 *   Example:
 *     const { isInstallable, isInstalled, handleInstall } = usePWAInstall();
 *     if (isInstallable) <button onClick={handleInstall}>Install App</button>
 */

import { useState, useEffect } from "react";

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * usePWAInstall
 *
 * Hook for managing PWA installation state and prompt.
 *
 * @returns {
 *   isInstallable: boolean, // True if the app can be installed (install prompt available)
 *   isInstalled: boolean,   // True if the app is already installed
 *   handleInstall: () => Promise<void> // Function to trigger the install prompt
 * }
 */
export function usePWAInstall() {
  // The deferred install prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Whether the app can be installed (install prompt available)
  const [isInstallable, setIsInstallable] = useState(false);
  // Whether the app is already installed
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(isAppInstalled);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * Triggers the PWA install prompt if available.
   * Handles user acceptance or dismissal.
   */
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setDeferredPrompt(null);
        setIsInstallable(false);
      } else {
        console.log("User dismissed the install prompt");
      }
    } catch (error) {
      console.error("Error during installation:", error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    handleInstall,
  };
}
