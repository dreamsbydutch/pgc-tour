"use client";

import { cn } from "@/src/lib/utils";
import { useState } from "react";
import { TourLogo } from "@/src/app/_components/OptimizedImage";
import type { ToursToggleButtonProps } from "../../types";

/**
 * ToursToggleButton Component
 *
 * Renders a button to toggle between tours in the standings view.
 */
export function ToursToggleButton({
  tour,
  tourToggle,
  setTourToggle,
}: ToursToggleButtonProps) {
  const [effect, setEffect] = useState(false);

  return (
    <button
      onClick={() => {
        setTourToggle(tour.id);
        setEffect(true);
      }}
      className={`${effect && "animate-toggleClick"} flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 text-lg font-bold sm:px-8 md:px-10 md:text-xl ${
        tourToggle === tour.id
          ? "shadow-btn bg-gray-600 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-800"
      }`}
      onAnimationEnd={() => setEffect(false)}
    >
      {" "}
      <TourLogo
        key={tour.id}
        src={tour.logoUrl}
        alt="Tour Logo"
        size="small"
        className={cn(
          tourToggle === tour.id &&
            !["pga", "playoffs", "gold", "silver"].includes(tour.id)
            ? "invert"
            : "",
        )}
      />
      {tour.shortForm}
    </button>
  );
}
