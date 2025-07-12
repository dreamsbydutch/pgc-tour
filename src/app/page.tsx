import Link from "next/link";
// import HomePageStandings from "@components/smartComponents/server/HomePageStandings";
// import HomePageLeaderboard from "@components/smartComponents/server/HomePageLeaderboard";
// import CurrentSchedule from "src/lib/smartComponents/server/CurrentSchedule";
// import CurrentChampions from "@components/smartComponents/server/CurrentChampions";
// import TournamentCountdownContainer from "@components/smartComponents/server/TournamentCountdownContainer";
import { getAuthData } from "@pgc-auth";
import SignInPage from "@app/(auth)/signin/page";
import { LeagueSchedule, TournamentCountdown } from "@pgc-components";
import { getNextTournament, getCurrentSchedule } from "@pgc-serverActions";
// import { getCurrentTourCard } from "@server/actions/tourCard";

export default async function Home() {
  const { isAuthenticated } = await getAuthData();
  const tournament = await getNextTournament();
  const schedule = await getCurrentSchedule();

  if (!isAuthenticated) return <SignInPage />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        PGC Tour Clubhouse
      </h1>
      <TournamentCountdown tourney={tournament ?? undefined} />
      {/* <CurrentChampions /> */}
      {/* <HomePageLeaderboard /> */}
      {/* <HomePageStandings /> */}
      {/* <TourCardForm /> */}
      <LeagueSchedule tournaments={schedule.tournaments} />
      <div id="footer" className="mt-12 flex flex-col justify-start">
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

// const groupChat = () => (
//   <Link
//     href={groupChatLink}
//     className="my-3 flex w-fit items-center justify-center rounded-lg bg-green-50 p-2 text-sm font-semibold text-slate-700 shadow-md"
//   >
//     <img
//       src="https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPIIVIUpPh4DfnxtyK0HbYZX9dkj8wcaQAqzrN"
//       alt="WhatsApp"
//       className="mr-2 w-6 rounded-md opacity-80"
//     />
//     Join the Group Chat
//   </Link>
// );
