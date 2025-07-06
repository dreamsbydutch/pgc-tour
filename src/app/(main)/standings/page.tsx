"use client";

import { useState } from "react";
import {
  GoldPlayoffHeader,
  PlayoffStandingsListing,
  SilverPlayoffHeader,
  StandingsHeader,
  StandingsListing,
  ToursToggleButton,
} from "@/lib/components/StandingsPage";
import { useCurrentStandings, useUser } from "@/lib/hooks";
import { api } from "@/trpc/react";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  // Use the new hooks instead of store
  const { tours, isLoading, error } = useCurrentStandings();
  const { user } = useUser();

  // Get current user's member data for their tour card
  const { data: currentMember } = api.member.getSelf.useQuery(undefined, {
    enabled: !!user,
  });

  // Get current user's tour card from the tours data
  const userTourCard = tours
    ?.flatMap((tour) => tour.tourCards)
    .find((card) => card.memberId === currentMember?.id);

  const inputTourId = searchParams.tour ?? userTourCard?.tourId ?? "";

  const [standingsToggle, setStandingsToggle] = useState<string>(
    inputTourId && inputTourId !== ""
      ? inputTourId
      : (userTourCard?.tourId ?? tours?.[0]?.id ?? ""),
  );

  const activeTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading standings...</div>
      </div>
    );
  }

  if (error || !tours?.length) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg text-red-600">Error loading standings</div>
      </div>
    );
  }

  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : activeTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view their stats and tournament history
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
              seasonId: userTourCard?.seasonId ?? "",
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

function TourStandings({
  activeTour,
}: {
  activeTour: ReturnType<typeof useCurrentStandings>["tours"][0] | undefined;
}) {
  if (!activeTour) return null;

  const tourCards = activeTour.tourCards;

  // Filter tour cards for gold playoff spots (top N)
  const goldCutCards = tourCards.filter(
    (_card, index) => index < (activeTour.playoffSpots[0] ?? 15),
  );

  // Filter tour cards for silver playoff spots (next N)
  const silverCutCards = tourCards.filter(
    (_card, index) =>
      index >= (activeTour.playoffSpots[0] ?? 15) &&
      index <
        (activeTour.playoffSpots[0] ?? 15) + (activeTour.playoffSpots[1] ?? 15),
  );

  // Filter remaining cards
  const remainingCards = tourCards.filter(
    (_card, index) =>
      index >=
      (activeTour.playoffSpots[0] ?? 15) + (activeTour.playoffSpots[1] ?? 15),
  );

  return (
    <div className="mx-auto px-1">
      <StandingsHeader />

      {/* Gold Playoff Qualifiers */}
      {goldCutCards.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}

      <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
        GOLD PLAYOFF CUT LINE
      </div>

      {/* Silver Playoff Qualifiers */}
      {silverCutCards.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}

      <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
        SILVER PLAYOFF CUT LINE
      </div>

      {/* Remaining Players */}
      {remainingCards.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}
    </div>
  );
}

function PlayoffStandings({
  tours,
}: {
  tours: NonNullable<ReturnType<typeof useCurrentStandings>["tours"]>;
}) {
  // Get current tiers for playoff data
  const { data: tiers } = api.tier.getCurrent.useQuery();

  // Get all tour cards and separate into gold and silver teams
  const allTourCards = tours.flatMap((tour) => tour.tourCards);

  const goldTeams = tours
    .map((tour) =>
      tour.tourCards.filter(
        (card, index) => index < (tour.playoffSpots[0] ?? 15),
      ),
    )
    .flat()
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const silverTeams = tours
    .map((tour) =>
      tour.tourCards.filter(
        (card, index) =>
          index >= (tour.playoffSpots[0] ?? 15) &&
          index < (tour.playoffSpots[0] ?? 15) + (tour.playoffSpots[1] ?? 15),
      ),
    )
    .flat()
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const playoffTier = tiers?.find((t) => t.name === "Playoff");

  return (
    <div className="mx-auto px-1">
      <GoldPlayoffHeader
        tier={{
          id: "gold",
          name: "Gold",
          payouts: playoffTier?.payouts.slice(0, 30) ?? [],
          points: playoffTier?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {goldTeams.map((tourCard) => (
        <PlayoffStandingsListing
          key={tourCard.id}
          tourCard={tourCard}
          teams={goldTeams}
          strokes={playoffTier?.points.slice(0, 30) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
        />
      ))}

      <SilverPlayoffHeader
        tier={{
          id: "silver",
          name: "Silver",
          payouts: playoffTier?.payouts.slice(75, 85) ?? [],
          points: playoffTier?.points.slice(75, 85) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {silverTeams.map((tourCard) => (
        <PlayoffStandingsListing
          key={tourCard.id}
          tourCard={tourCard}
          teams={silverTeams}
          strokes={playoffTier?.points.slice(0, 40) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
        />
      ))}
    </div>
  );
}
