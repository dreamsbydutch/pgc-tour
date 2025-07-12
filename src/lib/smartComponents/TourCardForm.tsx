"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import Link from "next/link";
import type { Tour } from "@prisma/client";

import { api } from "@pgc-trpcClient";
import { useSeasonalStore } from "@pgc-store";
import { LoadingSpinner, Button } from "@pgc-ui";
import { createTourCard } from "@pgc-serverActions";

export function TourCardForm() {
  const [isCreatingTourCard, setIsCreatingTourCard] = useState(false);
  const { tours, currentTourCard } = useSeasonalStore((state) => ({
    tours: state.tours,
    currentTourCard: state.tourCard,
  }));
  if (currentTourCard || !tours?.length) return null;
  return (
    <div className="my-4 flex flex-col items-center justify-center gap-4">
      <h2 className="text-center font-varela text-lg text-slate-600">
        Choose your Tour for 2025 season below.
      </h2>
      <div className="flex h-full flex-col gap-2 sm:flex-row">
        {tours.map((tour) => (
          <TourCardFormButton
            key={tour.id}
            tour={tour}
            isCreatingTourCard={isCreatingTourCard}
            setIsCreatingTourCard={setIsCreatingTourCard}
          />
        ))}
      </div>
      <div className="text-center font-varela text-base text-slate-600">
        Coordinate with your friends to make sure you sign up for the same tour
        for the best experience. For more info on the PGC Tour, check out the{" "}
        <Link href="/rulebook" className="underline">
          Rulebook.
        </Link>
      </div>
    </div>
  );
}

const TourCardFormButton = ({
  tour,
  isCreatingTourCard,
  setIsCreatingTourCard,
}: {
  tour: Tour;
  isCreatingTourCard: boolean;
  setIsCreatingTourCard: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const utils = api.useUtils();
  const [isLoading, setIsLoading] = useState(false);
  const [effect, setEffect] = useState(false);
  const tourCards = useSeasonalStore((state) => state.allTourCards);
  const maxSize = +(process.env.TOUR_MAX_SIZE ?? 75);
  const spotsRemaining = maxSize - (tourCards?.length ?? 0);

  const handleSubmit = useCallback(async () => {
    setIsCreatingTourCard(true);
    setIsLoading(true);
    setEffect(true);
    try {
      await createTourCard({ tourId: tour.id, seasonId: tour.seasonId });
      await utils.tour.invalidate();
    } catch (error) {
      console.error("Error creating tour card:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tour, utils, setIsCreatingTourCard]);

  return (
    <Button
      variant="secondary"
      size="xl"
      onClick={handleSubmit}
      disabled={isCreatingTourCard || spotsRemaining <= 0}
      className={[
        effect && "animate-toggleClick",
        "flex h-[16rem] w-[14rem] flex-col border-2 p-2 text-lg shadow-lg",
      ]
        .filter(Boolean)
        .join(" ")}
      onAnimationEnd={() => setEffect(false)}
    >
      {isLoading ? (
        <LoadingSpinner className="h-fit w-fit" />
      ) : (
        <>
          <Image
            src={typeof tour.logoUrl === "string" ? tour.logoUrl : ""}
            alt="Tour Logo"
            width={128}
            height={128}
            className="w-4/5"
          />
          {typeof tour.name === "string" ? tour.name : ""}
          <div className="text-xs text-slate-600">
            {spotsRemaining <= 0
              ? `${typeof tour.name === "string" ? tour.name : "Tour"} is full!`
              : `${spotsRemaining} spots remaining`}
          </div>
          <div className="text-xs text-slate-600">Buy-in: $100</div>
        </>
      )}
    </Button>
  );
};
