"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { forceRefreshCache } from "@/src/lib/store/cacheInvalidation";

interface EmergencyResetProps {
  message?: string;
  variant?: "inline" | "card";
  size?: "sm" | "default" | "lg";
}

export default function EmergencyReset({
  message = "Having trouble loading data?",
  variant = "inline",
  size = "default",
}: EmergencyResetProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      console.log("🚨 Emergency reset triggered");
      await forceRefreshCache("global");
      setTimeout(() => {
        setIsResetting(false);
      }, 1000);
    } catch (error) {
      console.error("Emergency reset failed:", error);
      setIsResetting(false);
    }
  };

  if (variant === "card") {
    return (
      <div className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div className="flex-1">
            <h3 className="mb-1 font-medium text-yellow-800">
              Data Loading Issue
            </h3>
            <p className="mb-3 text-sm text-yellow-700">{message}</p>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              size={size}
              variant="outline"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Cache
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>{message}</span>
      <Button
        onClick={handleReset}
        disabled={isResetting}
        size={size}
        variant="outline"
      >
        {isResetting ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Resetting...
          </>
        ) : (
          <>
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset Cache
          </>
        )}
      </Button>
    </div>
  );
}
