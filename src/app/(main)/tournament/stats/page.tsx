// "use client";

// import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
// import { api } from "@/trpc/react";
// import { ArrowLeftIcon } from "lucide-react";
// import Link from "next/link";
// import { Suspense, useState, type Dispatch, type SetStateAction } from "react";

// import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
// import LeaderboardHeader from "../_components/header/LeaderboardHeader";
// import type { Team, Tour, TourCard, Tournament } from "@prisma/client";
// import {
//   Table,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "@/lib/components/functionalComponents/ui/table";
// import { useSearchParams } from "next/navigation";

// export default function Page() {
//   const tournaments = useMainStore((state) => state.seasonTournaments);
//   const searchParams = useSearchParams();
//   const tournamentIdParam = searchParams.get("id");
//   const tournament = tournaments?.find(
//     (tournament) => tournament.id === tournamentIdParam,
//   );
//   const tours = useMainStore((state) => state.tours);
//   const tourCard = useMainStore((state) => state.currentTourCard);

//   return (
//     <div className="flex w-full flex-col">
//       <Suspense fallback={<LeaderboardHeaderSkeleton />}>
//         {tournament ? <LeaderboardHeader focusTourney={tournament} /> : <></>}
//       </Suspense>
//       <Suspense fallback={<LoadingSpinner />}>
//         {tournament && tours && tourCard && (
//           <StatsPage {...{ tournament, tours, tourCard }} />
//         )}
//       </Suspense>
//     </div>
//   );
// }

// function StatsPage({
//   tournament,
//   tours,
//   tourCard,
// }: {
//   tournament: Tournament;
//   tours: Tour[];
//   tourCard?: TourCard;
// }) {
//   const [activeTour, setActiveTour] = useState<string>(tourCard?.tourId ?? "");
//   const { data: teams, isLoading } = api.team.getByTournament.useQuery(
//     {
//       tournamentId: tournament?.id ?? "",
//     },
//     { staleTime: 30 * 1000 },
//   );

//   // Get the currently active teams for the selected tour
//   const tourTeams =
//     teams?.filter((team) => team.tourCard.tourId === activeTour) ?? [];

//   // Helper function to get sorted teams based on tour type
//   const getSortedTeams = () => {
//     if (!teams) return [];

//     const filteredTeams = teams.filter(
//       (team) => team.tourCard.tourId === activeTour,
//     );
//     return sortTeamsForSpecialPostions(filteredTeams);
//   };

//   if (isLoading) return <LoadingSpinner />;

//   return (
//     <div className="mt-2 px-2">
//       <Link
//         className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
//         href={`/tournament/${tournament.id}`}
//       >
//         <ArrowLeftIcon size={15} /> Back To Tournament
//       </Link>

//       <div className="mx-auto my-4 flex w-11/12 max-w-xl justify-around text-center">
//         {tours.map((tour) => (
//           <ToggleButton
//             tour={tour}
//             activeTour={activeTour}
//             setActiveTour={setActiveTour}
//             key={tour.id}
//           />
//         ))}
//       </div>

//       <Table>
//         <TableHeader>
//           <TableRow className="bg-gray-800 text-center font-bold text-gray-50">
//             <TableCell>Rank</TableCell>
//             <TableCell colSpan={4}>Name</TableCell>
//             <TableCell>Score</TableCell>
//             {[1, 2, 3, 4].map((round) => (
//               <TableCell key={`round-${round}`} colSpan={4}>
//                 Round {round}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHeader>

//         {activeTour ? (
//           getSortedTeams().length > 0 ? (
//             getSortedTeams().map((team) => (
//               <StatsListing
//                 key={team.id}
//                 team={team}
//                 teams={teams ?? []}
//                 tourTeams={tourTeams}
//               />
//             ))
//           ) : (
//             <TableRow>
//               <TableCell colSpan={22} className="py-4 text-center text-lg">
//                 No data available for this tour
//               </TableCell>
//             </TableRow>
//           )
//         ) : (
//           <TableRow>
//             <TableCell
//               colSpan={22}
//               className="py-4 text-center text-lg font-bold"
//             >
//               Choose a tour using the toggle buttons
//             </TableCell>
//           </TableRow>
//         )}
//       </Table>
//     </div>
//   );
// }

// function ToggleButton({
//   tour,
//   activeTour,
//   setActiveTour,
// }: {
//   tour: Tour;
//   activeTour: string;
//   setActiveTour: Dispatch<SetStateAction<string>>;
// }) {
//   const [effect, setEffect] = useState(false);

//   return (
//     <button
//       onClick={() => {
//         setActiveTour(tour.id);
//         setEffect(true);
//       }}
//       className={`${effect && "animate-toggleClick"} rounded-lg px-6 py-1 text-lg font-bold sm:px-8 md:text-xl ${
//         tour.id === activeTour
//           ? "shadow-btn bg-gray-700 text-gray-300"
//           : "shadow-btn bg-gray-300 text-gray-700"
//       }`}
//       onAnimationEnd={() => setEffect(false)}
//     >
//       {tour?.shortForm}
//     </button>
//   );
// }

// function sortTeamsForSpecialPostions(teams: Team[]) {
//   return teams
//     .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
//     .sort((a, b) => {
//       const getAdjustedScore = (team: Team) => {
//         const score = team.score ?? 999;
//         if (team.position === "DQ") return 999 + score;
//         if (team.position === "WD") return 888 + score;
//         if (team.position === "CUT") return 444 + score;
//         return score;
//       };

//       return getAdjustedScore(a) - getAdjustedScore(b);
//     });
// }

// function StatsListing({
//   team,
//   teams,
//   tourTeams,
// }: {
//   team: Team;
//   teams: Team[];
//   tourTeams: Team[];
// }) {
//   const tourCards = useMainStore((state) => state.tourCards);
//   const tourCard = tourCards?.find((card) => card.id === team.tourCardId);
//   return (
//     <TableRow className="border-slate-900 text-center">
//       <TableCell className="border-l border-slate-900 text-sm">
//         {team.position}
//       </TableCell>
//       <TableCell colSpan={4} className="whitespace-nowrap text-sm">
//         {tourCard?.displayName}
//       </TableCell>
//       <TableCell className="border-r border-slate-900 text-xs">
//         {team.score}
//       </TableCell>

//       <RoundCell
//         roundNum={1}
//         roundScore={team.roundOne}
//         team={team}
//         teams={teams}
//         tourTeams={tourTeams}
//       />

//       <RoundCell
//         roundNum={2}
//         roundScore={team.roundTwo}
//         team={team}
//         teams={teams}
//         tourTeams={tourTeams}
//       />

//       <RoundCell
//         roundNum={3}
//         roundScore={team.roundThree}
//         team={team}
//         teams={teams}
//         tourTeams={tourTeams}
//       />

//       <RoundCell
//         roundNum={4}
//         roundScore={team.roundFour}
//         team={team}
//         teams={teams}
//         tourTeams={tourTeams}
//       />
//     </TableRow>
//   );
// }

// function RoundCell({
//   roundNum,
//   roundScore,
//   team,
//   teams,
//   tourTeams,
// }: {
//   roundNum: 1 | 2 | 3 | 4;
//   roundScore: number | null;
//   team: Team;
//   teams: Team[];
//   tourTeams: Team[];
// }) {
//   // Helper functions
//   const getRoundProperty = (team: Team, round: 1 | 2 | 3 | 4) => {
//     switch (round) {
//       case 1:
//         return team.roundOne;
//       case 2:
//         return team.roundTwo;
//       case 3:
//         return team.roundThree;
//       case 4:
//         return team.roundFour;
//     }
//   };

//   const getCumulativeScoreUpToRound = (team: Team, round: 1 | 2 | 3 | 4) => {
//     let score = 0;
//     for (let i = 1; i <= round; i++) {
//       score += getRoundProperty(team, i as 1 | 2 | 3 | 4) ?? 999;
//     }
//     return score;
//   };

//   // Calculate values for this round
//   const roundAvg =
//     teams.reduce((p, c) => p + (getRoundProperty(c, roundNum) ?? 999), 0) /
//     teams.length;
//   const roundDiff = (roundScore ?? 999) - roundAvg;
//   const formattedDiff = formatScore(Math.round(roundDiff * 10) / 10);

//   // Calculate rankings
//   const sameRoundScoreCount = tourTeams.filter(
//     (a) => (getRoundProperty(a, roundNum) ?? 999) === (roundScore ?? 999),
//   ).length;

//   const betterRoundScoreCount = tourTeams.filter(
//     (a) => (getRoundProperty(a, roundNum) ?? 999) < (roundScore ?? 999),
//   ).length;

//   const roundRankPrefix = sameRoundScoreCount > 1 ? "T" : "";
//   const roundRank = `${roundRankPrefix}${betterRoundScoreCount + 1}`;

//   // Calculate cumulative ranking
//   const currentTeamCumulativeScore = getCumulativeScoreUpToRound(
//     team,
//     roundNum,
//   );

//   const sameCumulativeScoreCount = tourTeams.filter(
//     (a) =>
//       getCumulativeScoreUpToRound(a, roundNum) === currentTeamCumulativeScore,
//   ).length;

//   const betterCumulativeScoreCount = tourTeams.filter(
//     (a) =>
//       getCumulativeScoreUpToRound(a, roundNum) < currentTeamCumulativeScore,
//   ).length;

//   const cumulativeRankPrefix = sameCumulativeScoreCount > 1 ? "T" : "";
//   const cumulativeRank = `${cumulativeRankPrefix}${betterCumulativeScoreCount + 1}`;

//   return (
//     <>
//       <TableCell className="whitespace-nowrap border-r border-slate-400 text-xs">
//         {roundScore}
//       </TableCell>
//       <TableCell className="text-2xs font-semibold">{roundRank}</TableCell>
//       <TableCell className="whitespace-nowrap text-2xs font-semibold">
//         {cumulativeRank}
//       </TableCell>
//       <TableCell
//         className={cn(
//           "whitespace-nowrap border-r border-slate-900 text-2xs font-semibold",
//           Math.round(roundDiff * 10) / 10 < 0
//             ? "bg-green-50 text-green-900"
//             : "bg-red-50 text-red-900",
//         )}
//       >
//         {formattedDiff}
//       </TableCell>
//     </>
//   );
// }
