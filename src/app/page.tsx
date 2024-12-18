import { TourCardForm, TourCardOutput } from "./_components/TourCardForm";
import { db } from "../server/db";
import Link from "next/link";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // seedDatabase();
  const season = await db.season.findUnique({ where: { year: 2025 } });
  const tourCard = await db.tourCard.findFirst({
    where: { seasonId: season?.id, memberId: data.user?.id },
  });
  const tours = await db.tour.findMany({
    where: { seasonId: season?.id },
    include: { tourCards: true },
  });

  if (!tours || !season || !data.user) return <div>Error</div>;

  return (
    <div className="mx-1 my-4 flex h-[100vh] flex-col">
      <h1 className="py-3 text-center font-yellowtail text-5xl">
        Welcome to the PGC Tour
      </h1>

      {tourCard && (
        <>
          <TourCardOutput
            {...{
              name: tourCard.displayName,
              tourName: tours.filter((obj) => obj.id === tourCard.tourId)[0]
                ?.name,
              pictureUrl: tours.filter((obj) => obj.id === tourCard.tourId)[0]
                ?.logoUrl,
              tourCard: tourCard,
              memberId: data.user?.id,
            }}
          />
          <p className="mx-auto mb-8 w-5/6 text-center text-sm italic text-red-600">
            Payment info to come
          </p>
        </>
      )}
      {!tourCard && <TourCardForm {...{ tours }} />}

      <div className="mx-auto w-5/6 max-w-xl flex-wrap text-center font-varela text-sm">
        The PGC Tour is an elite fantasy golf experience. Both tours are
        identical and run in parallel, coordinate with your friends to ensure
        you sign up for the same tour. For more info on how the tour operates
        throughout the season check out the{" "}
        <Link href="/rulebook" className="underline">
          PGC Tour Rulebook
        </Link>
      </div>
    </div>
  );
}
