"use client";

import { Button } from "./ui/button";
import { TourLogo } from "./OptimizedImage";
import { createTourCard } from "@/src/server/api/actions/tour_card";
import { type Dispatch, type SetStateAction, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import Link from "next/link";
import type { Tour } from "@prisma/client";
import { api } from "@/src/trpc/react";
import { useUserData } from "@/src/lib/store/hooks/useUserData";

export function TourCardForm() {
  // Get current season for tours data
  const { data: currentSeason } = api.season.getCurrent.useQuery();

  // Get tours for current season
  const { data: tours } = api.tour.getBySeason.useQuery(
    {
      seasonID: currentSeason?.id,
    },
    {
      enabled: !!currentSeason?.id,
    },
  );

  // Get current tour card from user store
  const { currentTourCard } = useUserData();

  const [isCreatingTourCard, setIsCreatingTourCard] = useState(false);

  if (currentTourCard || !tours?.length) return null;
  return (
    <div className="my-4 flex flex-col items-center justify-center gap-4">
      <h2 className="text-center font-varela text-lg text-slate-600">
        Choose your Tour for 2025 season below.
      </h2>
      <div className="flex h-full flex-col gap-2 sm:flex-row">
        {tours?.map((tour) => (
          <TourCardFormButton
            key={tour.id}
            {...{ tour, isCreatingTourCard, setIsCreatingTourCard }}
          />
        ))}
      </div>
      <div className="text-center font-varela text-base text-slate-600">
        Coordinate with your friends to make sure you sign up for the same tour
        for the best experience. For more info on the PGC Tour, check out the
        <Link href="/rulebook" className="underline">
          Rulebook.
        </Link>
      </div>
    </div>
  );
}

function TourCardFormButton({
  tour,
  isCreatingTourCard,
  setIsCreatingTourCard,
}: {
  tour: Tour;
  isCreatingTourCard: boolean;
  setIsCreatingTourCard: Dispatch<SetStateAction<boolean>>;
}) {
  const utils = api.useUtils();
  const [isLoading, setIsLoading] = useState(false);
  const [effect, setEffect] = useState(false);
  const handleSubmit = async () => {
    setIsCreatingTourCard(true);
    setIsLoading(true);
    setEffect(true);
    await createTourCard({ tour: tour, seasonId: tour.seasonId });
    await utils.tour.invalidate();
    return;
  };
  const { data: tourCards } = api.tourCard.getByTourId.useQuery({
    tourId: tour.id,
  });

  return (
    <Button
      variant="secondary"
      size="xl"
      onClick={() => handleSubmit()}
      disabled={
        isCreatingTourCard ||
        (tourCards?.length ?? 0) >= +(process.env.TOUR_MAX_SIZE ?? 75)
      }
      className={`${effect && "animate-toggleClick"} flex h-[16rem] w-[14rem] flex-col border-2 p-2 text-lg shadow-lg`}
      onAnimationEnd={() => setEffect(false)}
    >
      {isLoading ? (
        <LoadingSpinner className="h-fit w-fit" />
      ) : (
        <>
          <TourLogo src={tour.logoUrl} alt="Tour Logo" className="w-4/5" />
          {tour.name}
          <div className="text-xs text-slate-600">
            {+(process.env.TOUR_MAX_SIZE ?? 75) - (tourCards?.length ?? 0) === 0
              ? tour.name + " is full!"
              : +(process.env.TOUR_MAX_SIZE ?? 75) -
                (tourCards?.length ?? 0) +
                " spots remaining"}
          </div>
          <div className="text-xs text-slate-600">Buy-in: $100</div>
        </>
      )}
    </Button>
  );
}
