import { createClient } from "../lib/supabase/server";
import TournamentCountdown from "./tournament/_components/TournamentCountdown";
import Link from "next/link";
import SignInPage from "./signin/page";
import HomePageLeaderboard from "./tournament/_views/HomePageLeaderboard";
import { api } from "../trpc/server";
import HomePageStandings from "./standings/_views/HomePageStandings";
import ChampionsPopup from "./tournament/_components/ChampionsPopup";
// import RegisterServiceWorker from "./_components/RegisterServiceWorker";
import { TourCardForm } from "./_components/TourCardForm";
import { createNewMember } from "../server/api/actions/member";
// import { groupChatLink } from "../lib/utils";

export default async function Home() {
  const member = await checkIfUserExists();
  if (!member) return <SignInPage />;

  const tours = await api.tour.getActive();
  const tournaments = await api.tournament.getInfo();
  const tourCards = await api.tourCard.getBySeason({
    seasonId: tours[0]?.seasonId ?? "",
  });
  const tourCard = tourCards.find((card) => card.memberId === member.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        PGC Tour Clubhouse
      </h1>
      {tournaments.past &&
      new Date(tournaments.past.endDate).getTime() >
        new Date().getTime() - 44 * 24 * 60 * 60 * 1000 ? (
        <ChampionsPopup {...{ tournament: tournaments.past, tours }} />
      ) : (
        <></>
      )}
      {/* <p className="mx-auto mb-4 font-varela text-base text-slate-500 md:text-lg">
        An elite fantasy golf experience
      </p> */}
      {!tourCard && <TourCardForm {...{ tours }} />}
      {!tournaments.current && tournaments.next && (
        <Link href={`/tournament/${tournaments.next.id}`}>
          <TournamentCountdown tourney={tournaments.next} />
        </Link>
      )}
      {tournaments.current && (
        <HomePageLeaderboard
          {...{
            tourney: tournaments.current,
            seasonId: tours[0]?.seasonId ?? undefined,
          }}
        />
      )}
      <HomePageStandings {...{ tours, member }} />
      <div className="mt-12 flex flex-col justify-start">
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

async function checkIfUserExists() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const member = data.user && (await api.member.getSelf());
  if (!member && data.user) {
    await createNewMember(data.user);
  }
  return member;
}
