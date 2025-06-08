"use client";

// Removed unused import: useMainStore
import { cn, formatMoney, formatScore } from "@/src/lib/utils";
import type { Team, Tour, TourCard } from "@prisma/client";
import { TourLogo } from "./OptimizedImage";
import LittleFucker from "./LittleFucker";
import { useAuth } from "@/src/lib/auth/Auth";

export function HomePageList({
  tour,
  teams,
}: {
  tour: Tour;
  teams: (Team & { tourCard: TourCard | null })[] | null | TourCard[];
}) {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <TourLogo
          alt="Tour Logo"
          src={tour.logoUrl ?? ""}
          className="mr-2 h-8 w-8"
        />
        {tour.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {teams?.map((team) => {
          // check if team is of type TeamData or TOurCard
          if ("tourCard" in team && team.tourCard) {
            return (
              <SingleListing
                tourCard={team.tourCard}
                key={team.id}
                memberId={team.tourCard.memberId}
                position={team.position}
                displayName={team.tourCard.displayName}
                mainStat={formatScore(team.score)}
                secondaryStat={team.thru === 18 ? "F" : team.thru}
              />
            );
          } else {
            return (
              <SingleListing
                tourCard={team as TourCard}
                key={team.id}
                memberId={"memberId" in team ? team.memberId : ""}
                position={team.position}
                displayName={"displayName" in team ? team.displayName : ""}
                mainStat={team.points}
                secondaryStat={formatMoney(team.earnings ?? 0)}
              />
            );
          }
        })}
      </div>
    </>
  );
}

function SingleListing({
  tourCard,
  memberId,
  position,
  displayName,
  mainStat,
  secondaryStat,
}: {
  tourCard: TourCard;
  memberId: string;
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
}) {
  const { member: self } = useAuth();
  const isFriend = self?.friends.includes(memberId);
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
        {tourCard && <LittleFucker tourCard={tourCard} />}
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

export function HomePageListSkeleton() {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center">
        <div className="mr-2 h-8 w-8 animate-pulse rounded-full bg-slate-300"></div>
        <div className="h-6 w-24 animate-pulse rounded-md bg-slate-300"></div>
      </div>
      <div className="mx-1 mb-3">
        {Array.from({ length: 15 }).map((_, idx) => (
          <TeamListingSkeleton key={idx} />
        ))}
      </div>
    </>
  );
}
function TeamListingSkeleton() {
  return (
    <div className="grid grid-cols-8 items-center justify-center rounded-md py-0.5 text-center">
      <div className="col-span-1 mx-auto h-4 w-4 animate-pulse rounded-sm bg-slate-300"></div>
      <div className="col-span-5 mx-auto h-4 w-full max-w-[85%] animate-pulse rounded-sm bg-slate-300"></div>
      <div className="col-span-2 mx-auto h-4 w-10 animate-pulse rounded-sm bg-slate-300"></div>
    </div>
  );
}
