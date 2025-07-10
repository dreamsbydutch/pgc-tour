"use client";

import { cn } from "@utils/main";
import Image from "next/image";
import { type Dispatch, type SetStateAction, useState } from "react";

/**
 * ToursToggleButton Component
 *
 * Renders a toggle button for a tour, allowing users to select the active tour.
 * Applies a click animation and updates localStorage and parent state on click.
 *
 * @param tour - The tour object to represent in the toggle button
 * @param tourToggle - The currently selected tour's ID
 * @param setTourToggle - Function to update the selected tour's ID
 */
export function ToursToggleButton({
  tour,
  tourToggle,
  setTourToggle,
}: {
  /**
   * The tour object to display in the toggle button
   */
  tour: { id: string; logoUrl: string | null; shortForm: string };
  /**
   * The currently selected tour's ID
   */
  tourToggle: string;
  /**
   * Function to update the selected tour's ID
   */
  setTourToggle: Dispatch<SetStateAction<string>>;
}) {
  /**
   * State to trigger the click animation effect
   */
  const [effect, setEffect] = useState(false);

  /**
   * Handles button click: sets localStorage, updates state, and triggers animation
   */
  const handleClick = () => {
    localStorage.setItem("activeTour", tour.id);
    setTourToggle(tour.id);
    setEffect(true);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        effect && "animate-toggleClick",
        "flex flex-row items-center justify-center gap-1 rounded-lg px-2 py-1 text-lg font-bold sm:px-8 md:px-10 md:text-xl",
        tourToggle === tour.id
          ? "shadow-btn bg-gray-600 text-gray-300"
          : "shadow-btn bg-gray-300 text-gray-800",
      )}
      onAnimationEnd={() => setEffect(false)}
    >
      <Image
        key={tour.id}
        src={tour.logoUrl ?? ""}
        alt="Tour Logo"
        width={512}
        height={512}
        className={cn(
          "mx-1 inline-block h-6 w-auto",
          tourToggle === tour.id &&
            tour.id !== "pga" &&
            tour.id !== "playoffs" &&
            tour.id !== "gold" &&
            tour.id !== "silver"
            ? "invert"
            : "",
        )}
      />
      {tour.shortForm}
    </button>
  );
}
