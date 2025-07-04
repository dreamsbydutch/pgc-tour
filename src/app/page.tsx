"use client";

import Link from "next/link";
import ChampionsPopup from "@/src/app/(main)/tournament/components/ui/ChampionsPopup";
import TournamentCountdown from "@/src/app/(main)/tournament/components/ui/TournamentCountdown";
import { TourCardForm } from "./_components/TourCardForm";
import HomePageLeaderboard from "./(main)/tournament/views/shared/HomePageLeaderboard";
import SignInPage from "./(auth)/signin/page";
import HomePageStandings from "./(main)/standings/views/shared/HomePageStandings";
import { cn } from "@/src/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./_components/ui/table";
import { OptimizedImage } from "./_components/OptimizedImage";
import { preloadCriticalImages } from "@/src/lib/utils/image-optimization";
import { api } from "@/src/trpc/react";
import { useAuth } from "@/src/lib/auth/Auth";
import { useEffect } from "react";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Preload critical images when component mounts
  useEffect(() => {
    preloadCriticalImages();
  }, []);

  // If not authenticated, show only the sign-in component
  if (!authLoading && !isAuthenticated) {
    return <SignInPage />;
  }

  // For authenticated users, show the main content
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2">
      <h1 className="py-4 text-center font-yellowtail text-6xl md:text-7xl">
        PGC Tour Clubhouse
      </h1>
      <ChampionsPopup />
      <HomePageLeaderboard />
      <TournamentCountdown />
      <HomePageStandings />
      <TourCardForm />
      <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
        <div className="my-3 flex items-center justify-center gap-3">
          <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
            PGC Schedule
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

function CurrentSchedule() {
  const { data: tournaments } = api.tournament.getAll.useQuery();
  const { data: tiers } = api.tier.getCurrent.useQuery();

  return (
    <Table className="mx-auto w-3/4 text-center font-varela">
      <TableHeader>
        <TableRow>
          <TableHead className="span text-center text-xs font-bold">
            Tournament
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Dates
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Tier
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Course
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Location
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tournaments?.map((tourney, i) => {
          const tier = tiers?.find((t) => t.id === tourney.tierId);
          const start = new Date(tourney.startDate);
          const end = new Date(tourney.endDate);
          return (
            <TableRow
              key={tourney.id}
              className={cn(
                i === 16 ? "border-t-2 border-t-slate-500" : "",
                i >= 16 ? "bg-yellow-50" : "",
                tier?.name === "Major" ? "bg-blue-50" : "",
              )}
            >
              <TableCell className="flex items-center justify-center whitespace-nowrap text-center text-xs">
                <OptimizedImage
                  src={tourney.logoUrl ?? ""}
                  className="pr-1"
                  alt={tourney.name}
                  width={25}
                  height={25}
                  sizes="25px"
                />
                {tourney.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {`${start.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} - ${
                  start.getMonth() === end.getMonth()
                    ? end.toLocaleDateString("en-US", {
                        day: "numeric",
                      })
                    : end.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                }`}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tier?.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course?.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course?.location}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
