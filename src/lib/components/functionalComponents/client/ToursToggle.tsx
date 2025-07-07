"use client";

import { Tour } from "@prisma/client";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { cn } from "../../../utils/core";

export function ToursToggleButton({
  tour,
  tourToggle,
  setTourToggle,
}: {
  tour: Pick<Tour, "id" | "logoUrl" | "shortForm">;
  tourToggle: string;
  setTourToggle: Dispatch<SetStateAction<string>>;
}) {
  const [effect, setEffect] = useState(false);
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
        src={tour.logoUrl}
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
