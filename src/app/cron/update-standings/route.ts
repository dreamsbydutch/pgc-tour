"use server";

import { api } from "@/src/trpc/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  const season = await api.season.getCurrent();
  let tourCards = await api.tourCard.getBySeasonId({ seasonId: season?.id });

  if (tourCards) {
    tourCards = await Promise.all(
      tourCards.map(async (tourCard) => {
        const teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
        tourCard.earnings = teams.reduce(
          (p, c) => (p += Math.round((c.earnings ?? 0) * 100) / 100),
          0,
        );
        tourCard.points = teams.reduce(
          (p, c) => (p += Math.round(c.points ?? 0)),
          0,
        );
        return tourCard;
      }),
    );
    tourCards = await Promise.all(
      tourCards.map(async (tourCard) => {
        tourCard.position =
          (tourCards &&
          tourCards.filter(
            (a) => a.tourId === tourCard.tourId && a.points === tourCard.points,
          ).length > 1
            ? "T"
            : "") +
          (tourCards &&
            tourCards.filter(
              (a) =>
                a.tourId === tourCard.tourId &&
                (a.points ?? 0) > (tourCard.points ?? 0),
            ).length + 1);
        await api.tourCard.update({
          id: tourCard.id,
          position: tourCard.position,
          points: tourCard.points ?? undefined,
          earnings: tourCard.earnings,
        });
        return tourCard;
      }),
    );
  }
    return NextResponse.redirect(`${origin}/`);
}
