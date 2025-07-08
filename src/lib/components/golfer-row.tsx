// // filepath: c:\Users\choug\OneDrive\Documents\GitHub\pgc-tour\src\app\(main)\history\components\golfer-row.tsx
// import {
//   TableCell,
//   TableRow,
// } from "@/lib/components/functionalComponents/ui/table";
// import { cn } from "@/lib/utils/main";;
// import { Tournament } from "@prisma/client";

// interface GolferRowProps {
//   golfer: {
//     name: string;
//     apps: number;
//     wins: number;
//     top5s: number;
//     top10s: number;
//     cutsMade: number;
//     avgUsage: number | null;
//     groupCounts: Record<number, number>;
//     lowGroup: number | null;
//     highGroup: number | null;
//     groupOne?: number | null;
//     groupTwo?: number | null;
//     groupThree?: number | null;
//     groupFour?: number | null;
//     groupFive?: number | null;
//   };
//   golfersData: any[];
//   nextTournament: Tournament | null;
//   currentTournament: Tournament | null;
//   pastTournament: Tournament | null;
// }

// export function GolferRow({
//   golfer,
//   golfersData,
//   nextTournament,
//   currentTournament,
//   pastTournament,
// }: GolferRowProps) {
//   return (
//     <TableRow key={golfer.name}>
//       <TableCell className="whitespace-nowrap border-b border-gray-200 p-1 text-center">
//         {golfer.name}
//       </TableCell>
//       <TableCell className="border-b border-gray-200 p-1 text-center">
//         {golfer.apps}
//       </TableCell>
//       <TableCell className="border-b border-gray-200 p-1 text-center">
//         {golfer.wins}
//       </TableCell>
//       <TableCell className="border-b border-gray-200 p-1 text-center">
//         {golfer.top5s}
//       </TableCell>
//       <TableCell className="border-b border-gray-200 p-1 text-center">
//         {golfer.top10s}
//       </TableCell>
//       <TableCell className="flex flex-row items-center justify-center gap-1 border-b border-gray-200 p-1 text-center">
//         {golfer.cutsMade}{" "}
//         <span className="text-2xs text-slate-500">
//           ({Math.round((golfer.cutsMade / golfer.apps) * 1000) / 10}%)
//         </span>
//       </TableCell>
//       <TableCell className="border-b border-gray-200 p-1 text-center">
//         {golfer.avgUsage?.toFixed(2) ?? "-"}
//         <span className="ml-0.5 text-xs">%</span>
//       </TableCell>{" "}
//       {[1, 2, 3, 4, 5].map((groupNum) => {
//         // Get the corresponding group percentage property name
//         const groupPropName =
//           `group${["One", "Two", "Three", "Four", "Five"][groupNum - 1]}` as keyof typeof golfer;
//         const groupPercentage = golfer[groupPropName] as number | null;

//         return (
//           <TableCell
//             key={`group-${groupNum}`}
//             className={cn(
//               "border-b border-gray-200 p-1 text-center text-2xs",
//               groupNum === 1 ? "border-l-2 border-l-gray-300" : "",
//               (golfersData?.filter((a) => a.tournamentId === nextTournament?.id)
//                 .length ?? 0) > 0 &&
//                 golfersData?.find(
//                   (g) =>
//                     g.playerName === golfer.name &&
//                     g.tournamentId === nextTournament?.id,
//                 )?.group === groupNum
//                 ? "bg-slate-50 font-bold"
//                 : (golfersData?.filter(
//                       (a) => a.tournamentId === nextTournament?.id,
//                     ).length ?? 0) === 0 &&
//                     (golfersData?.filter(
//                       (a) => a.tournamentId === currentTournament?.id,
//                     ).length ?? 0) > 0 &&
//                     golfersData?.find(
//                       (g) =>
//                         g.playerName === golfer.name &&
//                         g.tournamentId === currentTournament?.id,
//                     )?.group === groupNum
//                   ? "bg-slate-50 font-bold"
//                   : (golfersData?.filter(
//                         (a) => a.tournamentId === nextTournament?.id,
//                       ).length ?? 0) === 0 &&
//                       (golfersData?.filter(
//                         (a) => a.tournamentId === currentTournament?.id,
//                       ).length ?? 0) === 0 &&
//                       (golfersData?.filter(
//                         (a) => a.tournamentId === pastTournament?.id,
//                       ).length ?? 0) > 0 &&
//                       golfersData?.find(
//                         (g) =>
//                           g.playerName === golfer.name &&
//                           g.tournamentId === pastTournament?.id,
//                       )?.group === groupNum
//                     ? "bg-slate-50 font-bold"
//                     : "",
//             )}
//           >
//             {(groupPercentage ?? 0) > 0 && groupPercentage !== null
//               ? `${Math.round(groupPercentage * 10) / 10}%`
//               : "-"}
//           </TableCell>
//         );
//       })}
//     </TableRow>
//   );
// }
