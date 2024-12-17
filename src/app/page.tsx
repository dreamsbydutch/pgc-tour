import { TourCardForm, TourCardOutput } from "./_components/TourCardForm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "../server/db";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default async function Home() {
  // seedDatabase();
  const user = await currentUser();
  const season = await db.season.findUnique({ where: { year: 2025 } });
  const tourCard = await db.tourCard.findFirst({
    where: { seasonId: season?.id, userId: user?.id },
  });
  const tours = await db.tour.findMany({
    where: { seasonId: season?.id },
    include: { tourCards: true },
  });

  if (!tours || !season) return <div>Error</div>;

  return (
    <div className="mx-1 my-4 flex h-[100vh] flex-col">
      <SignedIn>
        <h1 className="py-3 text-center font-yellowtail text-5xl">
          Welcome to the PGC Tour
        </h1>

        {tourCard && (
          <>
            <TourCardOutput
              {...{
                name: tourCard.fullName,
                tourName: tours.filter((obj) => obj.id === tourCard.tourId)[0]
                  ?.name,
                pictureUrl: tours.filter((obj) => obj.id === tourCard.tourId)[0]
                  ?.logoUrl,
                tourCard: tourCard,
              }}
            />
            <p className="mx-auto mb-8 w-5/6 text-center text-sm italic text-red-600">
              {tourCard.account === 0 && `Payment info to come`}
            </p>
          </>
        )}
        {!tourCard && <TourCardForm {...{ tours }} />}
      </SignedIn>
      <SignedOut>
        <div>Sign in here</div>
        <div></div>
      </SignedOut>
      {/* <div className="mx-auto w-5/6 max-w-xl flex-wrap text-center font-varela text-sm">
        The PGC Tour is an elite fantasy golf experience. Both tours are
        identical and run in parallel, coordinate with your friends to ensure
        you sign up for the same tour. For more info on how the tour operates
        throughout the season check out the{" "}
        <Link href="/rulebook" className="underline">
          PGC Tour Rulebook
        </Link>
      </div> */}
    </div>
  );
}
