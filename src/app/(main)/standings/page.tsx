"use client";

import { useMainStore } from "@/src/lib/store/store";
import { useState } from "react";
import {
  GoldPlayoffHeader,
  PlayoffStandingsListing,
  SilverPlayoffHeader,
  StandingsHeader,
  StandingsListing,
  ToursToggleButton,
} from "./_components/StandingsPage";
import type { Tour } from "@prisma/client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const tours = useMainStore((state) => state.tours);
  const tourCard = useMainStore((state) => state.currentTourCard);
  const inputTourId = searchParams.tour ?? tourCard?.tourId ?? "";

  const [standingsToggle, setStandingsToggle] = useState<string>(
    inputTourId && inputTourId !== ""
      ? inputTourId
      : (tourCard?.tourId ?? tours?.[0]?.id ?? ""),
  );
  const activeTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];

  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : activeTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view thier stats and tournament history
      </div>
      {(tours?.length ?? 0) > 1 && (
        <div className="mx-auto my-4 flex w-full flex-row items-center justify-center gap-4 text-center">
          {tours
            ?.sort((a, b) => a.shortForm.localeCompare(b.shortForm))
            .map((tour) => (
              <ToursToggleButton
                key={"toggle-" + tour.id}
                tour={tour}
                tourToggle={standingsToggle}
                setTourToggle={setStandingsToggle}
              />
            ))}
          <ToursToggleButton
            key={"toggle-playoffs"}
            tour={{
              name: "Playoffs",
              shortForm: "Playoffs",
              seasonId: tourCard?.seasonId ?? "",
              id: "playoffs",
              buyIn: 0,
              playoffSpots: [30, 40],
              logoUrl:
                "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
              updatedAt: new Date(),
              createdAt: new Date(),
            }}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        </div>
      )}
      {standingsToggle === "playoffs" ? (
        <PlayoffStandings tours={tours} />
      ) : (
        <TourStandings activeTour={activeTour} />
      )}
    </>
  );
}

function TourStandings({ activeTour }: { activeTour: Tour | undefined }) {
  const tourCards = useMainStore((state) => state.tourCards);
  return (
    <div className="mx-auto px-1">
      <StandingsHeader />
      {tourCards
        ?.filter((obj) => obj.tourId === activeTour?.id)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .filter(
          (obj) =>
            +(obj.position?.replace("T", "") ?? 0) <=
            (activeTour?.playoffSpots[0] ?? 0),
        )
        .map((tourCard) => (
          <StandingsListing
            key={tourCard.id}
            {...{
              tourCard,
            }}
          />
        ))}
      <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
        GOLD PLAYOFF CUT LINE
      </div>
      {tourCards
        ?.filter((obj) => obj.tourId === activeTour?.id)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .filter(
          (obj) =>
            +(obj.position?.replace("T", "") ?? 0) >
              (activeTour?.playoffSpots[0] ?? 0) &&
            +(obj.position?.replace("T", "") ?? 0) <=
              (activeTour?.playoffSpots[0] ?? 0) +
                (activeTour?.playoffSpots[1] ?? 0),
        )
        .map((tourCard) => (
          <StandingsListing
            key={tourCard.id}
            {...{
              tourCard,
            }}
          />
        ))}
      <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
        SILVER PLAYOFF CUT LINE
      </div>
      {tourCards
        ?.filter((obj) => obj.tourId === activeTour?.id)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .filter(
          (obj) =>
            +(obj.position?.replace("T", "") ?? 0) >
            (activeTour?.playoffSpots[0] ?? 0) +
              (activeTour?.playoffSpots[1] ?? 0),
        )
        .map((tourCard) => (
          <StandingsListing
            key={tourCard.id}
            {...{
              tourCard,
            }}
          />
        ))}
    </div>
  );
}

function PlayoffStandings({ tours }: { tours: Tour[] | null }) {
  const tourCards = useMainStore((state) => state.tourCards);
  const tiers = useMainStore((state) => state.currentTiers);
  const goldTeams = tours
    ?.map(
      (tour) =>
        tourCards?.filter(
          (obj) =>
            obj.tourId === tour.id &&
            +(obj.position?.replace("T", "") ?? 100) <=
              (tour.playoffSpots[0] ?? 15),
        ) ?? [],
    )
    .flat();
  const silverTeams = tours
    ?.map(
      (tour) =>
        tourCards?.filter(
          (obj) =>
            obj.tourId === tour.id &&
            +(obj.position?.replace("T", "") ?? 100) >
              (tour.playoffSpots[0] ?? 15) &&
            +(obj.position?.replace("T", "") ?? 100) <=
              (tour.playoffSpots[0] ?? 15) + (tour.playoffSpots[1] ?? 15),
        ) ?? [],
    )
    .flat();
  return (
    <div className="mx-auto px-1">
      <GoldPlayoffHeader
        tier={{
          id: "gold",
          name: "Gold",
          payouts:
            tiers?.find((t) => t.name === "Playoff")?.payouts.slice(0, 30) ??
            [],
          points:
            tiers?.find((t) => t.name === "Playoff")?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />
      {goldTeams
        ?.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .map((tourCard) => (
          <PlayoffStandingsListing
            key={tourCard.id}
            {...{
              tourCard,
              teams: goldTeams,
              strokes:
                tiers?.find((t) => t.name === "Playoff")?.points.slice(0, 30) ??
                [],
            }}
          />
        ))}
      <SilverPlayoffHeader
        tier={{
          id: "silver",
          name: "SIlver",
          payouts:
            tiers?.find((t) => t.name === "Playoff")?.payouts.slice(75, 85) ??
            [],
          points:
            tiers?.find((t) => t.name === "Playoff")?.points.slice(75, 85) ??
            [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />
      {silverTeams
        ?.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .map((tourCard) => (
          <PlayoffStandingsListing
            key={tourCard.id}
            {...{
              tourCard,
              teams: silverTeams,
              strokes:
                tiers?.find((t) => t.name === "Playoff")?.points.slice(0, 40) ??
                [],
            }}
          />
        ))}
    </div>
  );
}
