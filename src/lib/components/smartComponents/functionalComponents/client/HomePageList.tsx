"use client";

import Image from "next/image";
import LittleFucker from "../../client/LittleFucker";
import type { Tour, Member } from "@prisma/client";
import { cn } from "@/lib/utils/main";

// Only include the minimal required fields for each type
type MinimalTour = Pick<Tour, "logoUrl" | "shortForm">;

type MinimalTeam = {
  id: number | string;
  memberId: string;
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
};

type MinimalSelf = Pick<Member, "id" | "friends"> | null | undefined;

export function HomePageList({
  tour,
  teams,
  seasonId,
  self,
}: {
  tour: MinimalTour;
  teams: MinimalTeam[] | null;
  seasonId: string;
  self: MinimalSelf;
}) {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <Image
          alt="Tour Logo"
          src={tour.logoUrl ?? ""}
          className="mr-2 h-8 w-8"
          width={128}
          height={128}
        />
        {tour.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {teams?.map((team) => (
          <SingleListing
            key={team.id}
            memberId={team.memberId}
            seasonId={seasonId}
            position={team.position}
            displayName={team.displayName}
            mainStat={team.mainStat}
            secondaryStat={team.secondaryStat}
            self={self}
          />
        ))}
      </div>
    </>
  );
}

function SingleListing({
  seasonId,
  memberId,
  position,
  displayName,
  mainStat,
  secondaryStat,
  self,
}: {
  seasonId: string;
  memberId: string;
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
  self: MinimalSelf;
}) {
  const isFriend = !!self?.friends?.includes(memberId);
  const isSelf = self?.id === memberId;

  return (
    <div
      className={cn(
        "grid grid-cols-8 items-center justify-center rounded-md text-center md:grid-cols-11 md:px-2",
        isFriend && "bg-slate-100",
        isSelf && "bg-slate-200 font-semibold",
      )}
    >
      <div className="col-span-1 place-self-center py-0.5 text-xs">
        {position}
      </div>
      <div className="col-span-5 flex items-center justify-center place-self-center py-0.5 text-sm md:col-span-6">
        {displayName}
        <LittleFucker memberId={memberId} seasonId={seasonId} />
      </div>
      <div className="col-span-2 place-self-center py-0.5 text-sm">
        {mainStat}
      </div>
      <div className="col-span-2 hidden place-self-center py-0.5 text-sm md:block">
        {secondaryStat}
      </div>
    </div>
  );
}
