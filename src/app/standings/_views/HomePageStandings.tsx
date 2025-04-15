"use client";

import { cn, formatMoney } from "@/src/lib/utils";
import { Member, Tour, TourCard } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { TourData } from "@/src/types/prisma_include";
import LittleFucker from "../../_components/LittleFucker";

/**
 * HomePageStandings Component
 *
 * Displays the standings for the homepage, showing the top players for two tours.
 * - Fetches and displays data for the "CCG" and "DbyD" tours.
 * - Includes links to the full standings for each tour.
 *
 * Props:
 * - season: The current season data (optional).
 */
export default function HomePageStandings({
  tours,
  member,
}: {
  tours: TourData[];
  member: Member;
}) {
  if (!tours || tours.length === 0) {
    return <LoadingSpinner className="h-[1.5rem] w-[1.5rem]" />;
  }
  return (
    <div className="mx-1 mt-8 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="mb-4 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        Tour Standings
      </div>
      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => {
          return (
            <Link
              key={tour.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/standings?tour=${tour.id}`}
              aria-label={`View standings for ${tour.shortForm} Tour`}
            >
              <TourSection {...{ tour, member }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * getTopTourCards Function
 *
 * Filters and sorts the top tour cards for a specific tour.
 *
 * @param tourCards - The list of all tour cards in the season.
 * @param shortForm - The short form of the tour (e.g., "CCG", "DbyD").
 * @returns The top 15 tour cards for the specified tour.
 */
function getTopTourCards(tourCards: TourCard[]) {
  return tourCards
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 15);
}

/**
 * TourSection Component
 *
 * Displays the standings section for a specific tour.
 * - Includes the tour logo, name, and a list of top players.
 *
 * Props:
 * - tourCard: The list of tour cards for the tour.
 */
function TourSection({ tour, member }: { tour: TourData; member: Member }) {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <Image
          src={tour.logoUrl}
          alt="Tour Logo"
          className="mr-2 h-8 w-8"
          width={128}
          height={128}
        />
        {tour.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {getTopTourCards(tour.tourCards).map((tourCard) => (
          <TeamListing key={tourCard.id} {...{ tourCard, member }} />
        ))}
      </div>
    </>
  );
}

/**
 * TeamListing Component
 *
 * Displays a single player's standings in the leaderboard.
 * - Highlights the user's standings and their friends' standings.
 *
 * Props:
 * - tourCard: The tour card data to display.
 */
function TeamListing({
  tourCard,
  member,
}: {
  tourCard: TourCard;
  member: Member;
}) {
  return (
    <div
      className={cn(
        member.id === tourCard.memberId ? "bg-slate-200 font-semibold" : "",
        member.friends.includes(tourCard.memberId) ? "bg-slate-100" : "",
        "grid grid-cols-8 items-center justify-center rounded-md text-center md:grid-cols-11 md:px-4",
      )}
    >
      {/* Player Position */}
      <div className="col-span-1 place-self-center py-0.5 text-center text-xs">
        {tourCard.position}
      </div>
      {/* Player Name */}
      <div className="col-span-5 place-self-center py-0.5 text-center text-base md:col-span-6">
        {tourCard.displayName}
        <LittleFucker tourCard={tourCard} />
      </div>
      {/* Player Points */}
      <div className="col-span-2 place-self-center py-0.5 text-center text-sm">
        {tourCard.points}
      </div>
      {/* Player Points */}
      <div className="col-span-2 hidden place-self-center py-0.5 text-center text-sm md:block">
        {formatMoney(tourCard.earnings)}
      </div>
    </div>
  );
}
