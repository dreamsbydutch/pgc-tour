"use client";

import Image from "next/image";
import { cn } from "@pgc-utils";
import { LittleFucker } from "@pgc-components";
import { getUserHighlightStatus, filterChampionsForMember } from "../utils";
import { UI_CONSTANTS } from "../utils/constants";
import type {
  HomePageListingsTour,
  HomePageListingsTeam,
  HomePageListingsUser,
  HomePageListingsChampion,
} from "../utils/types";

export function HomePageList({
  tour,
  teams,
  self,
  champions,
}: {
  tour: HomePageListingsTour;
  teams: HomePageListingsTeam[] | null;
  self: HomePageListingsUser | null;
  champions?: HomePageListingsChampion[] | null;
}) {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <Image
          alt="Tour Logo"
          src={tour.logoUrl ?? ""}
          className="mr-2 h-8 w-8"
          width={UI_CONSTANTS.TOUR_LOGO_SIZE}
          height={UI_CONSTANTS.TOUR_LOGO_SIZE}
        />
        {tour.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {teams?.map((team) => (
          <SingleListing
            key={team.id}
            memberId={team.memberId}
            position={team.position}
            displayName={team.displayName}
            mainStat={team.mainStat}
            secondaryStat={team.secondaryStat}
            self={self}
            champions={filterChampionsForMember(
              champions,
              team.memberId,
              tour.seasonId,
            )}
          />
        ))}
      </div>
    </>
  );
}

function SingleListing({
  memberId,
  position,
  displayName,
  mainStat,
  secondaryStat,
  self,
  champions,
}: {
  memberId: string;
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
  self: HomePageListingsUser | null;
  champions?: HomePageListingsChampion[] | null;
}) {
  const { isFriend, isSelf } = getUserHighlightStatus(memberId, self);

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
        {champions && <LittleFucker champions={champions} />}
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
