import { createClient } from "../lib/supabase/server";
import TournamentCountdown from "./tournament/_components/TournamentCountdown";
import { formatName, groupChatLink } from "../lib/utils";
import Link from "next/link";
import SignInPage from "./signin/page";
import HomePageLeaderboard from "./tournament/_components/HomePageLeaderboard";
import { api } from "../trpc/server";
import HomePageStandings from "./standings/_components/HomePageStandings";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const member = data.user && (await api.member.getSelf());
  if (!member && data.user) {
    const fullName = formatName(
      data.user?.user_metadata.name as string,
      "full",
    );
    const splitName = fullName.split(" ");
    await api.member.create({
      id: data.user.id,
      email: data.user.email ?? (data.user.user_metadata.email as string),
      fullname: fullName,
      firstname: splitName[0] ?? "",
      lastname: splitName.slice(1).toString(),
    });
  }
  if (!member) return <SignInPage />;

  const season = await api.season.getByYear({ year: new Date().getFullYear() });
  const tours = await api.tour.getBySeason({ seasonID: season?.id });
  const pastTourney = await api.tournament.getRecent();
  const currentTourney = await api.tournament.getCurrent();
  const nextTourney = await api.tournament.getNext();

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        PGC Tour Clubhouse
      </h1>
      {/* <p className="mx-auto mb-4 font-varela text-base text-slate-500 md:text-lg">
        An elite fantasy golf experience
      </p> */}

      {!currentTourney && nextTourney && (
        <TournamentCountdown tourney={nextTourney} />
      )}
      {currentTourney && (
        <HomePageLeaderboard
          {...{ tourney: currentTourney, season: season ?? undefined }}
        />
      )}
      <div className="mt-12 flex flex-col justify-start">
        {/* <HomePageStandings /> */}
        {/* <Link
          href={groupChatLink}
          className="my-3 flex w-fit items-center justify-center rounded-lg bg-green-50 p-2 text-sm font-semibold text-slate-700 shadow-md"
        >
          <img
            src="https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPIIVIUpPh4DfnxtyK0HbYZX9dkj8wcaQAqzrN"
            alt="WhatsApp"
            className="mr-2 w-6 rounded-md opacity-80"
          />
          Join the Group Chat
        </Link> */}
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

// const PreSeason = ({
//   tourCard,
//   member,
//   tours,
//   tourney,
//   data,
// }: {
//   tourCard: TourCard;
//   member: Member;
//   tours: TourData[];
//   tourney: Tournament;
//   data: { user: User | null };
// }) => {
//   return (
//     <>
//       {tourCard && data.user && (
//         <>
//           <TourCardOutput
//             {...{
//               name: member?.fullname,
//               tour: tours.find((obj) => obj.id === tourCard.tourId),
//               pictureUrl: tours.find((obj) => obj.id === tourCard.tourId)
//                 ?.logoUrl,
//               tourCard: tourCard,
//               memberId: data.user.id,
//             }}
//           />
//           <p
//             className={`mx-auto mb-8 w-5/6 text-center text-sm italic ${member.account > 0 ? "text-red-600" : "text-slate-700"}`}
//           >
//             {member &&
//               (member.account > 0
//                 ? `Please pay your ${formatMoney(member.account)} tour fee to puregolfcollectivetour@gmail.com. Buy-in must be paid prior to Feb. 1st, 2025.`
//                 : "Your tour fee has been paid, thank you.")}
//           </p>
//           {tourney && <TournamentCountdown tourney={tourney} />}
//         </>
//       )}
//       {!tourCard && data.user && <TourCardForm {...{ tours }} />}
//     </>
//   );
// };
