import { TourCardForm } from "./_components/TourCardForm";
import { db } from "../server/db";
import { createClient } from "../lib/supabase/server";
import TournamentCountdown from "./tournament/_components/TournamentCountdown";
import { formatMoney, formatName } from "../lib/utils";
import { TourCardOutput } from "./_components/TourCardOutput";
import Link from "next/link";
import { tourDataIncludeTourCard } from "../types/prisma_include";
import SignInPage from "./signin/page";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const season = await db.season.findUnique({ where: { year: 2025 } });
  const tourCard = await db.tourCard.findFirst({
    where: { seasonId: season?.id, memberId: data.user?.id },
  });
  const tours = await db.tour.findMany({
    where: { seasonId: season?.id },
    include: tourDataIncludeTourCard,
  });
  const member =
    data.user && (await db.member.findUnique({ where: { id: data.user.id } }));
  if (!member && data.user) {
    const fullName = formatName(
      data.user?.user_metadata.name as string,
      "full",
    );
    const splitName = fullName.split(" ");
    await db.member.create({
      data: {
        id: data.user.id,
        email: data.user.email ?? (data.user.user_metadata.email as string),
        role: "regular",
        fullname: fullName,
        firstname: splitName[0],
        lastname: splitName.slice(1).toString(),
      },
    });
  }
  const tourney = await db.tournament.findFirst({
    where: {
      seasonId: season?.id,
    },
    orderBy: { startDate: "asc" },
  });
  if (!tours || !season) return <div>Error</div>;

  return (
    <div className="flex flex-col">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        Welcome to the PGC Tour
      </h1>
      <p className="mb-4 max-w-xl text-center font-varela text-base text-slate-500 md:text-lg">
        An elite fantasy golf experience
      </p>

      {tourCard && data.user && (
        <>
          <TourCardOutput
            {...{
              name: member?.fullname,
              tour: tours.find((obj) => obj.id === tourCard.tourId),
              pictureUrl: tours.find((obj) => obj.id === tourCard.tourId)
                ?.logoUrl,
              tourCard: tourCard,
              memberId: data.user.id,
            }}
          />
          <p className="mx-auto mb-8 w-5/6 text-center text-sm italic text-red-600">
            {member &&
              (member.account > 0
                ? `Please pay your ${formatMoney(member.account)} buy-in to puregolfcollectivetour@gmail.com. Buy-in must be paid prior to Feb. 1st, 2025.`
                : null)}
          </p>
          {tourney && <TournamentCountdown tourney={tourney} />}
        </>
      )}
      {!tourCard && data.user && <TourCardForm {...{ tours }} />}
      <div className="mt-4 flex flex-col justify-start">
        <Link href={"/privacy"} className="text-xs text-slate-400">
          Privacy Policy
        </Link>
        <Link href={"/terms"} className="text-xs text-slate-400">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
