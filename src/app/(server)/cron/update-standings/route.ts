"use server";

import { api } from "@/src/trpc/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  const season = await api.season.getCurrent();
  let tourCards = await api.tourCard.getBySeason({
    seasonId: season?.id ?? "",
  });

  if (tourCards) {
    tourCards = await Promise.all(
      tourCards.map(async (tourCard) => {
        let teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
        teams = teams.filter((obj) => (obj.round ?? 0) > 4);
        tourCard.win = teams.filter(
          (obj) => +(obj.position?.replace("T", "") ?? 0) === 1,
        ).length;
        tourCard.topTen = teams.filter(
          (obj) => +(obj.position?.replace("T", "") ?? 0) <= 10,
        ).length;
        tourCard.madeCut = teams.filter((obj) => obj.position !== "CUT").length;
        tourCard.appearances = teams.length;
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
          win: tourCard.win,
          topTen: tourCard.topTen,
          madeCut: tourCard.madeCut,
          appearances: tourCard.appearances,
        });
        return tourCard;
      }),
    );

    // Notify cache invalidation system that standings have been updated
    try {
      const invalidateResponse = await fetch(`${origin}/api/cache/invalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "standings",
          source: "cron-update-standings",
        }),
      });

      if (invalidateResponse.ok) {
        console.log("✅ Cache invalidation notification sent successfully");
      } else {
        console.error("❌ Failed to send cache invalidation notification");
      }
    } catch (error) {
      console.error("Error sending cache invalidation notification:", error);
    }
  }
  return NextResponse.redirect(`${origin}/`);
}

// localhost:3000/cron/update-standings
