"use client";

import Link from "next/link";
import { useInitStore } from "@/src/lib/store/useInitStore";
import ChampionsPopup from "@/src/app/(main)/tournament/_components/ChampionsPopup";
import TournamentCountdown from "@/src/app/(main)/tournament/_components/TournamentCountdown";
import { TourCardForm } from "./_components/TourCardForm";
import HomePageLeaderboard from "./(main)/tournament/_views/HomePageLeaderboard";
import SignInPage from "./(auth)/signin/page";
import HomePageStandings from "./(main)/standings/_views/HomePageStandings";
import { useMainStore } from "../lib/store/store";
import Image from "next/image";
import { CurrentSchedule } from "./(main)/rulebook/page";

export default function Home() {
  useInitStore();
  const tiers = useMainStore((state) => state.currentTiers);
  if (!tiers)
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto flex animate-pulse items-center justify-center text-center font-varela text-3xl text-slate-600">
          <Image
            src={"/logo512.png"}
            alt="PGC Logo"
            width={96}
            height={96}
            className="mx-2"
          />
          <div className="w-44 text-center">Loading Clubhouse Data.....</div>
        </div>
      </div>
    );
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        PGC Tour Clubhouse
      </h1>
      <SignInPage />
      <ChampionsPopup />
      <HomePageLeaderboard />
      <TournamentCountdown />
      <HomePageStandings />
      <TourCardForm />
      <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
        <div className="my-3 flex items-center justify-center gap-3">
          <Image
            src={"/logo512.png"}
            alt="PGC Logo"
            width={512}
            height={512}
            className="h-14 w-14"
          />
          <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
            Schedule
          </h2>
        </div>
        <CurrentSchedule />
      </div>
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
