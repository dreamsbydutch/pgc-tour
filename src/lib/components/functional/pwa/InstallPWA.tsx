"use client";

import { useState, useEffect } from "react";

/**
 * Type for the beforeinstallprompt event
 *
 * Extends the standard Event to include the prompt() method and userChoice promise.
 */
interface BeforeInstallPromptEvent extends Event {
  /**
   * Triggers the install prompt dialog
   */
  prompt: () => Promise<void>;
  /**
   * Resolves with the user's choice after the prompt
   */
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * useInstallPWA hook
 *
 * Handles PWA installation logic, including listening for the install prompt,
 * tracking installability, and providing an installApp function.
 *
 * @returns {
 *   isInstallable: boolean; // Whether the app can be installed
 *   isInstalled: boolean;   // Whether the app is already installed
 *   installApp: () => Promise<boolean>; // Function to trigger the install prompt
 * }
 */
export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(isAppInstalled);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
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
   * Triggers the PWA install prompt if available
   * @returns Promise<boolean> - true if accepted, false otherwise
   */
  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      // Show the install prompt
      await installPrompt.prompt();
      // Wait for the user to respond to the prompt
      const result = await installPrompt.userChoice;

      if (result.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log("User dismissed the install prompt");
        return false;
      }
    } catch (error) {
      console.error("Error during installation:", error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}

/**
 * InstallPWAButton Component
 *
 * Renders a floating button that allows the user to install the PWA if available.
 * Uses the useInstallPWA hook for logic.
 */
export default function InstallPWAButton() {
  const { isInstallable, isInstalled, installApp } = useInstallPWA();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      onClick={installApp}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-lg transition-colors duration-200 hover:bg-emerald-700"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Install App
    </button>
  );
}
