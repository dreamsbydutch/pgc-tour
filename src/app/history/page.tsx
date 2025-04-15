"use client";

import { formatMoney } from "@/src/lib/utils";
import { api } from "@/src/trpc/react";
import type { Member, TourCard } from "@prisma/client";

export default function historyPage() {
  const members = api.member.getAll.useQuery().data;
  const tourCards = api.tourCard.getAll.useQuery().data;
  const teams = api.team.getAll.useQuery().data;
  const updatedMembers = members?.map((member) =>
    updateMembers({ member, tourCards }),
  );
  return (
    <>
      {/* <MajorWinners members={members} tourCards={tourCards} teams={teams} /> */}
      {updatedMembers
        ?.sort((a, b) => b.appearances - a.appearances)
        ?.sort((a, b) => b.points - a.points)
        ?.sort((a, b) => b.earnings - a.earnings)
        ?.sort((a, b) => b.win - a.win)
        .map((member) => <MemberListing member={member} key={member.id} />)}
    </>
  );
}

function MemberListing({ member }: { member: Member }) {
  return (
    <div key={member.id} className="flex justify-between">
      <div>{member.fullname}</div>
      <div>{member.points}</div>
      <div>{formatMoney(member.earnings)}</div>
      <div>{member.win}</div>
      <div>{member.topTen}</div>
      <div>{member.madeCut}</div>
      <div>{member.appearances}</div>
    </div>
  );
}

function updateMembers({
  member,
  tourCards,
}: {
  member: Member;
  tourCards: TourCard[] | undefined;
}) {
  const filteredTourCards = tourCards?.filter(
    (card) => card.memberId === member.id,
  );
  const points =
    filteredTourCards?.reduce((p, c) => (p += c.points ?? 0), 0) ?? 0;
  const earnings =
    filteredTourCards?.reduce((p, c) => (p += c.earnings ?? 0), 0) ?? 0;
  const win = filteredTourCards?.reduce((p, c) => (p += c.win ?? 0), 0) ?? 0;
  const topTen =
    filteredTourCards?.reduce((p, c) => (p += c.topTen ?? 0), 0) ?? 0;
  const madeCut =
    filteredTourCards?.reduce((p, c) => (p += c.madeCut ?? 0), 0) ?? 0;
  const appearances =
    filteredTourCards?.reduce((p, c) => (p += c.appearances ?? 0), 0) ?? 0;
  return { ...member, earnings, points, win, topTen, madeCut, appearances };
}

// function MajorWinners({
//   members,
//   tourCards,
//   teams,
// }: {
//   members: Member[] | undefined;
//   tourCards: TourCard[] | undefined;
//   teams: TeamData[] | undefined;
// }) {
//   const majorWinners = teams
//     ?.filter(
//       (obj) =>
//         obj.tournament.tier.name === "Major" &&
//         +(obj.position?.replace("T", "") ?? 0) === 1,
//     )
//     .sort((a, b) => a.tournament.name.localeCompare(b.tournament.name));
//   const memberIds = new Set(
//     majorWinners?.map((team) => team.tourCard.memberId),
//   );
//   const majorWinnersMembers = members?.filter((member) =>
//     memberIds.has(member.id),
//   );
//   const memberMajorWins = majorWinnersMembers?.map((member) => {
//     const majorWins = majorWinners?.filter(
//       (team) => team.tourCard.memberId === member.id,
//     );

//     return { ...member, majorWins: majorWins as TeamData[] };
//   });

//   const sortedMajorWinners = memberMajorWins
//     ?.sort((a, b) =>
//       (a.majorWins?.[0]?.tournament.name ?? "").localeCompare(
//         b.majorWins?.[0]?.tournament.name ?? "",
//       ),
//     )
//     .sort((a, b) => (b.majorWins?.length ?? 0) - (a.majorWins?.length ?? 0));

//   return (
//     <div className="flex flex-col justify-between">
//       <div className="font-yellowtail">Major Champions</div>
//       <MastersPlaque members={sortedMajorWinners} />
//     </div>
//   );
// }

// function MastersPlaque({
//   members,
// }: {
//   members: (Member & { majorWins: TeamData[] })[] | undefined;
// }) {
//   return (
//     <div className="flex flex-col items-center rounded-lg bg-gray-800 p-4 text-white shadow-lg">
//       <h2 className="mb-4 h-10 text-2xl font-bold">
//         <Image
//           src={members?.[0]?.majorWins?.[0]?.tournament?.logoUrl ?? ""}
//           alt={
//             members?.[0]?.majorWins?.[0]?.tournament?.name ??
//             "Tournament name unavailable"
//           }
//           width={512}
//           height={512}
//         />
//         The Masters
//       </h2>
//       <div className="flex flex-col gap-2">
//         {members?.map((member) => (
//           <div
//             key={member.id}
//             className="border-b border-gray-600 pb-1 text-lg font-medium"
//           >
//             {member.fullname}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
