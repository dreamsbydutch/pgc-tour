"use client";

import { Button } from "./ui/button";
import Image from "next/image";
import { TourCard } from "@prisma/client";
import { TourData } from "@/src/types/prisma_include";
import {
  createTourCard,
  deleteTourCard,
} from "@/src/server/api/actions/tour_card";
import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { api } from "@/src/trpc/react";

export function TourCardForm({ tours }: { tours: TourData[] }) {
  const utils = api.useUtils();
  return (
    <div className="my-4 flex flex-col items-center justify-center gap-4">
      <h2 className="text-center font-varela text-lg text-slate-600">
        Choose your Tour for 2025 season below
      </h2>
      <div className="flex h-full flex-col gap-2 sm:flex-row">
        {tours.map((tour) => {
          const [effect, setEffect] = useState(false);
          return (
            <Button
              variant="secondary"
              size="xl"
              onClick={() => {
                setEffect(true);
                utils.tour.invalidate();
                createTourCard({ tourId: tour.id, seasonId: tour.seasonId });
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
        })}
      </div>
    </div>
  );
}

export function TourCardOutput({
  name,
  tourName,
  pictureUrl,
  tourCard,
}: {
  name: string | undefined;
  tourName: string | undefined;
  pictureUrl: string | undefined;
  tourCard: TourCard;
}) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center">
      <h2 className="max-w-xl text-center font-varela text-lg text-slate-600">
        Thank you for joining season 5 of the PGC Tour. More info will come
        prior to the 2025 Waste Managment Open.
      </h2>
      <div className="mx-auto my-4 flex w-[12rem] min-w-fit flex-col items-center justify-center rounded-lg border-2 border-gray-400 bg-gray-300 p-4 text-center shadow-2xl 2xs:w-[18rem] sm:w-[22rem]">
        <Image
          src={pictureUrl || ""}
          alt="Tour Logo"
          width={75}
          height={75}
          className="h-3/4 max-h-32 w-3/4 max-w-32"
        />
        <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
        <p className="text-base italic text-gray-600">{tourName}</p>
      </div>
      <TourCardChangeButton tourCard={tourCard} />
    </div>
  );
}
function TourCardChangeButton({ tourCard }: { tourCard: TourCard }) {
  const [effect, setEffect] = useState(false);
  const [confirmEffect, setConfirmEffect] = useState(false);
  const user = useAuth();
  const utils = api.useUtils();
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (user.userId !== tourCard.userId) return null;

  const handleConfirm = () => {
    setConfirmEffect(true);
    utils.tour.invalidate();
    deleteTourCard({ tourCardId: tourCard.id });
    console.log("Server action executed");
    setIsModalOpen(false);
  };

  const handleButtonClick = () => {
    setEffect(true);
    setIsModalOpen(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={`${effect && "animate-toggleClick"} mx-auto mt-6 w-1/2 xs:w-2/5 sm:w-1/3`}
          onAnimationEnd={() => setEffect(false)}
          variant="destructive"
          size="xs"
          onClick={handleButtonClick}
        >
          Switch Tours
        </Button>
      </DialogTrigger>
      <DialogContent className="w-3/4 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Tour Card</DialogTitle>
          <DialogDescription>
            This will delete your current Tour Card and allow you to re-sign up
            if spots are available.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleConfirm}
            className={confirmEffect ? "animate-toggleClick" : ""}
            onAnimationEnd={() => setConfirmEffect(false)}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
