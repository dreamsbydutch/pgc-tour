"use client";

import { Button } from "@/lib/components/ui/button";
import Image from "next/image";
import type { Tour, TourCard } from "@prisma/client";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import { api } from "@trpcLocal/react";
import LoadingSpinner from "@/lib/smartComponents/functionalComponents/loading/LoadingSpinner";
import { deleteTourCard } from "@/server/actions/tourCard";

export function TourCardOutput({
  name,
  tour,
  pictureUrl,
  tourCard,
  memberId,
}: {
  name?: string;
  tour?: Tour;
  pictureUrl?: string;
  tourCard: TourCard;
  memberId: string;
}) {
  const tourCards = api.tourCard.getByTourId.useQuery({
    tourId: tour?.id ?? "",
  }).data;
  if (!tour) return <LoadingSpinner />;
  const spotsRemaining =
    +(process.env.TOUR_MAX_SIZE ?? 75) - (tourCards?.length ?? 0);
  return (
    <div className="mt-2 flex flex-col items-center justify-center">
      <h2 className="max-w-xl text-center font-varela text-lg text-slate-600">
        {`You have secured your spot on the ${tour.name}. The 2025 season will begin with the Waste Management Open on Feb 6th.`}
      </h2>
      <div className="mx-auto mt-4 flex w-[12rem] min-w-fit flex-col items-center justify-center rounded-lg border-2 border-gray-400 bg-gray-300 p-4 text-center shadow-2xl 2xs:w-[18rem] sm:w-[22rem]">
        <Image
          src={pictureUrl ?? ""}
          alt="Tour Logo"
          width={75}
          height={75}
          className="h-3/4 max-h-32 w-3/4 max-w-32"
        />
        <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
        <p className="text-base italic text-gray-600">{tour.name}</p>
      </div>
      <div className="mb-2 mt-2 text-xs text-slate-600">
        {spotsRemaining === 0
          ? `${tour.name} is full!`
          : `${spotsRemaining} spots remaining`}
      </div>
      <TourCardChangeButton tourCard={tourCard} memberId={memberId} />
    </div>
  );
}

const TourCardChangeButton = ({
  tourCard,
  memberId,
}: {
  tourCard: TourCard;
  memberId: string;
}) => {
  const utils = api.useUtils();
  const [isLoading, setIsLoading] = useState(false);
  const [effect, setEffect] = useState(false);
  const [confirmEffect, setConfirmEffect] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    setConfirmEffect(true);
    try {
      await utils.tour.invalidate();
      await deleteTourCard({ tourCard });
    } catch (error) {
      console.error("Error deleting tour card:", error);
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  }, [tourCard, utils]);

  const handleButtonClick = useCallback(() => {
    setEffect(true);
    setIsModalOpen(true);
  }, []);

  if (memberId !== tourCard.memberId) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          className={[
            effect && "animate-toggleClick",
            "mx-auto my-2 h-[1.5rem] w-1/2 xs:w-2/5 sm:w-1/3",
          ]
            .filter(Boolean)
            .join(" ")}
          onAnimationEnd={() => setEffect(false)}
          variant="destructive"
          onClick={handleButtonClick}
        >
          Switch Tours
        </Button>
      </DialogTrigger>
      <DialogContent className="w-3/4 sm:max-w-[425px]">
        {isLoading ? (
          <LoadingSpinner className="h-fit" />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Delete Tour Card</DialogTitle>
              <DialogDescription>
                This will delete your current Tour Card and allow you to re-sign
                up if spots are available.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleDelete}
                className={confirmEffect ? "animate-toggleClick" : ""}
                onAnimationEnd={() => setConfirmEffect(false)}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
