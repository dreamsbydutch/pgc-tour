// "use client";

// import { useMemo } from "react";
// import type { Golfer, Team } from "@prisma/client";
// import { useUser } from "@/lib/hooks";
// import { api } from "@/trpc/react";
// import { CreateTeamForm } from "../../functionalComponents/client/CreateTeamForm";
// import LoadingSpinner from "../../functionalComponents/loading/LoadingSpinner";
// import { useCurrentSeasonTourCardId } from "../../../hooks/useTourCard";

// // Utility types
// // (should match your explicit form field types)
// type GolferFormFields = Pick<
//   Golfer,
//   "apiId" | "playerName" | "worldRank" | "rating" | "group"
// >;

// function groupGolfers(
//   golfers: GolferFormFields[],
// ): { key: string; golfers: GolferFormFields[] }[] {
//   return [1, 2, 3, 4, 5].map((groupNum) => ({
//     key: `group${groupNum}`,
//     golfers: golfers
//       .filter((golfer) => golfer.group === groupNum)
//       .sort((a, b) => (a.worldRank ?? 9999) - (b.worldRank ?? 9999)),
//   }));
// }
// function getInitialGroups(existingTeam: Team | null): { golfers: number[] }[] {
//   if (!existingTeam) {
//     return Array.from({ length: 5 }, () => ({ golfers: [] as number[] }));
//   }
//   const result: { golfers: number[] }[] = Array.from({ length: 5 }, () => ({
//     golfers: [] as number[],
//   }));
//   existingTeam.golferIds.forEach((golferId: number, index: number) => {
//     const groupIndex = Math.floor(index / 2);
//     if (groupIndex < 5) {
//       result[groupIndex]?.golfers.push(golferId);
//     }
//   });
//   return result;
// }

// export default function CreateTeamPage({
//   tournamentId,
//   setPickingTeam,
// }: {
//   tournamentId: string;
//   setPickingTeam: React.Dispatch<React.SetStateAction<boolean>>;
// }) {
//   const { user } = useUser();

//   // Early return if user is not loaded
//   if (!user) return <LoadingSpinner />;

//   // Get current season tour card id (memoized for stability)
//   const tourCardId = useCurrentSeasonTourCardId(user.id);
//   if (!tourCardId) {
//     return <div className="text-red-500">Tour Card Required</div>;
//   }

//   // Fetch golfers
//   const {
//     data: golfersDataRaw = [],
//     isLoading: isLoadingGolfers,
//     error: golfersError,
//   } = api.golfer.getByTournament.useQuery({ tournamentId });

//   // Prepare golfers data (no need for useMemo unless data is huge)
//   const golfersData: GolferFormFields[] = golfersDataRaw.map((g) => ({
//     apiId: g.apiId,
//     playerName: g.playerName,
//     worldRank: g.worldRank,
//     rating: g.rating,
//     group: g.group,
//   }));

//   // Group golfers (useMemo for derived data)
//   const groups = useMemo(() => groupGolfers(golfersData), [golfersData]);

//   // Fetch existing team (only if tourCardId and tournamentId are present)
//   const { data: existingTeam, error: teamError } =
//     api.team.getByUserTournament.useQuery(
//       { tourCardId, tournamentId },
//       { enabled: Boolean(tourCardId && tournamentId) },
//     );

//   // Initial groups (useMemo for derived data)
//   const initialGroups = useMemo(
//     () => getInitialGroups(existingTeam ?? null),
//     [existingTeam],
//   );

//   return (
//     <div className="mx-auto max-w-6xl px-4 py-6 font-varela">
//       <CreateTeamForm
//         tournament={{ id: tournamentId }}
//         tourCard={{ id: tourCardId }}
//         setPickingTeam={setPickingTeam}
//         groups={groups}
//         initialGroups={initialGroups}
//         isLoadingGolfers={isLoadingGolfers}
//         golfersError={golfersError}
//         teamError={teamError}
//       />
//     </div>
//   );
// }
