"use client";

import { Button } from "./ui/button";
import Image from "next/image";
import { type TourData } from "@/src/types/prisma_include";
import { createTourCard } from "@/src/server/api/actions/tour_card";
import { useState } from "react";
import { api } from "@/src/trpc/react";

export function TourCardForm({ tours }: { tours: TourData[] }) {
  return (
    <div className="my-4 flex flex-col items-center justify-center gap-4">
      <h2 className="text-center font-varela text-lg text-slate-600">
        Choose your Tour for 2025 season below
      </h2>
      <div className="flex h-full flex-col gap-2 sm:flex-row">
        {tours.map((tour) => (
          <TourCardFormButton key={tour.id} {...{ tour }} />
        ))}
      </div>
    </div>
  );
}

function TourCardFormButton({ tour }: { tour: TourData }) {
  const utils = api.useUtils();
  const [effect, setEffect] = useState(false);
  return (
    <Button
      variant="secondary"
      size="xl"
      onClick={async () => {
        setEffect(true);
        await utils.tour.invalidate();
        await createTourCard({ tour: tour, seasonId: tour.seasonId });
      }}
      className={`${effect && "animate-toggleClick"} flex h-fit flex-col border-2 p-2 text-lg shadow-lg`}
      onAnimationEnd={() => setEffect(false)}
    >
      <Image
        src={tour.logoUrl}
        alt="Tour Logo"
        width={75}
        height={75}
        className="h-3/5 w-3/5"
      />
      {tour.name}
      <div className="text-xs text-slate-600">
        {75 - tour.tourCards.length} spots remaining
      </div>
      <div className="text-xs text-slate-600">Buy-in: $100</div>
    </Button>
  );
}
