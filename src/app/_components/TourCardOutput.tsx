"use client";

import { Button } from "./ui/button";
import Image from "next/image";
import { type TourCard } from "@prisma/client";
import { type TourData } from "@/src/types/prisma_include";
import { deleteTourCard } from "@/src/server/api/actions/tour_card";
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
import LoadingSpinner from "./LoadingSpinner";
import { useRouter } from "next/navigation";

export function TourCardOutput({
  name,
  tour,
  pictureUrl,
  tourCard,
  memberId,
}: {
  name: string | undefined;
  tour: TourData | undefined;
  pictureUrl: string | undefined;
  tourCard: TourCard;
  memberId: string;
}) {
  if (!tour) return <LoadingSpinner />;
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
        {75 - tour.tourCards.length} spots remaining
      </div>
      <TourCardChangeButton {...{ tourCard, memberId }} />
    </div>
  );
}
function TourCardChangeButton({
  tourCard,
  memberId,
}: {
  tourCard: TourCard;
  memberId: string;
}) {
  const router = useRouter()
  const utils = api.useUtils();

  const [isLoading, setIsLoading] = useState(false);
  const [effect, setEffect] = useState(false);
  const [confirmEffect, setConfirmEffect] = useState(false);
  const [_isModalOpen, setIsModalOpen] = useState(false);

  if (memberId !== tourCard.memberId) return null;

  const handleDelete = async () => {
    setIsLoading(true)
    setConfirmEffect(true);
    await utils.tour.invalidate();
    await deleteTourCard({ tourCard: tourCard });
    console.log("Server action executed");
    router.push("/")
    setIsModalOpen(false);
    setIsLoading(false)
  };

  const handleButtonClick = () => {
    setEffect(true);
    setIsModalOpen(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={`${effect && "animate-toggleClick"} mx-auto my-2 h-[1.5rem] w-1/2 xs:w-2/5 sm:w-1/3`}
          onAnimationEnd={() => setEffect(false)}
          variant="destructive"
          onClick={handleButtonClick}
        >
          Switch Tours
        </Button>
      </DialogTrigger>
      <DialogContent className="w-3/4 sm:max-w-[425px]">
        {isLoading ? <LoadingSpinner className="h-fit"/> : <>
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
              onClick={() => handleDelete()}
              className={confirmEffect ? "animate-toggleClick" : ""}
              onAnimationEnd={() => setConfirmEffect(false)}
            >
              Continue
            </Button>
          </DialogFooter></>}
      </DialogContent>
    </Dialog>
  );
}
