import { TourCardForm, TourCardOutput } from "./_components/TourCardForm";
import { db } from "../server/db";
import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import TournamentCountdown from "./tournament/_components/TournamentCountdown";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const season = await db.season.findUnique({ where: { year: 2025 } });
  const tourCard = await db.tourCard.findFirst({
    where: { seasonId: season?.id, memberId: data.user?.id },
  });
  const tours = await db.tour.findMany({
    where: { seasonId: season?.id },
    include: { tourCards: true },
  });

  const seasonAlt = await db.season.findUnique({ where: { year: 2024 } });
  const tourney = await db.tournament.findFirst({
    where: {
      seasonId: seasonAlt?.id,
    },
    orderBy: { startDate: "asc" },
  });
  if (!tours || !season || !data.user || !tourney) return <div>Error</div>;

  return (
    <div className="flex h-[100vh] flex-col">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        Welcome to the PGC Tour
      </h1>
      <p className="mb-4 max-w-xl text-center font-varela text-base text-slate-500 md:text-lg">
        An elite fantasy golf experience
      </p>

      {tourCard && (
        <>
          <TourCardOutput
            {...{
              name: tourCard.displayName,
              tour: tours.find((obj) => obj.id === tourCard.tourId),
              pictureUrl: tours.find((obj) => obj.id === tourCard.tourId)
                ?.logoUrl,
              tourCard: tourCard,
              memberId: data.user?.id,
            }}
          />
          <p className="mx-auto mb-8 w-5/6 text-center text-sm italic text-red-600">
            Payment info to come
          </p>
          <TournamentCountdown tourney={tourney} />
        </>
      )}
      {!tourCard && <TourCardForm {...{ tours }} />}
      <Link href={"/privacy"} className="text-xs">
        Privacy Policy
      </Link>
      <Link href={"/terms"} className="text-xs">
        Terms of Service
      </Link>
    </div>
  );
}
