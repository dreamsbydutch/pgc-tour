import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { batchProcess } from "@/lib/utils/main";

/**
 * Main function to update standings for all tour cards
 */
export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  try {
    // Create a TRPC context with cron job authorization
    const requestHeaders = new Headers(headers());
    requestHeaders.set("x-cron-secret", process.env.CRON_SECRET ?? "");
    requestHeaders.set("x-trpc-source", "cron");

    const ctx = await createTRPCContext({
      headers: requestHeaders,
    });

    const api = createCaller(ctx);

    const season = await api.season.getCurrent();
    const tourCards = await api.tourCard.getBySeason({
      seasonId: season?.id ?? "",
    });

    if (tourCards) {
      // First pass: calculate stats for each tour card
      await batchProcess(
        tourCards,
        10,
        async (tourCard) => {
          let teams = await api.team.getByTourCard({ tourCardId: tourCard.id });
          teams = teams.filter((obj) => (obj.round ?? 0) > 4);
          tourCard.win = teams.filter(
            (obj) => +(obj.position?.replace("T", "") ?? 0) === 1,
          ).length;
          tourCard.topTen = teams.filter(
            (obj) => +(obj.position?.replace("T", "") ?? 0) <= 10,
          ).length;
          tourCard.madeCut = teams.filter(
            (obj) => obj.position !== "CUT",
          ).length;
          tourCard.appearances = teams.length;
          tourCard.earnings = teams.reduce(
            (p, c) => (p += Math.round((c.earnings ?? 0) * 100) / 100),
            0,
          );
          tourCard.points = teams.reduce(
            (p, c) => (p += Math.round(c.points ?? 0)),
            0,
          );
        },
        100,
      );

      // Second pass: calculate positions and update in database
      await batchProcess(
        tourCards,
        10,
        async (tourCard) => {
          tourCard.position =
            (tourCards &&
            tourCards.filter(
              (a) =>
                a.tourId === tourCard.tourId && a.points === tourCard.points,
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
        },
        50,
      );
    }
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error("Error updating standings:", error);
    return NextResponse.json(
      { error: "Failed to update standings" },
      { status: 500 },
    );
  }
}

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
