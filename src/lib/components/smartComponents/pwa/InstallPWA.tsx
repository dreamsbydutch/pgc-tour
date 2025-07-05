"use client";

import { useState, useEffect } from "react";

export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isAppInstalled);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e);
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

  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      // Show the install prompt
      installPrompt.prompt();
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
