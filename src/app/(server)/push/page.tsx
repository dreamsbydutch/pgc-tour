// "use client";
// import { useEffect, useState } from "react";
// import {
//   checkPermissionStateAndAct,
//   notificationUnsupported,
//   registerAndSubscribe,
//   sendPicksReminder,
// } from "../_components/Push";
// import { api } from "@/src/trpc/react";

// export default function Home() {
//   const [unsupported, setUnsupported] = useState<boolean>(false);
//   const [subscription, setSubscription] = useState<PushSubscription | null>(
//     null,
//   );
//   const [message, setMessage] = useState<string | null>(null);
//   const member = api.member.getSelf.useQuery().data;
//   useEffect(() => {
//     const isUnsupported = notificationUnsupported();
//     setUnsupported(isUnsupported);
//     if (isUnsupported) {
//       return;
//     }
//     checkPermissionStateAndAct(setSubscription, member ?? undefined);
//   }, []);

//   const tournament = api.tournament.getNext.useQuery().data;
//   const teams = api.team.getByTournament.useQuery({
//     tournamentId: tournament?.id,
//   }).data;

//   return (
//     <main>
//       <div className="">
//         <button
//           disabled={unsupported}
//           onClick={() =>
//             registerAndSubscribe(setSubscription, member ?? undefined)
//           }
//           className={subscription ? "" : ""}
//         >
//           {unsupported
//             ? "Notification Unsupported"
//             : subscription
//               ? "Notification allowed"
//               : "Allow notification"}
//         </button>
//         {subscription ? (
//           <>
//             <input
//               placeholder={"Type push message ..."}
//               style={{ marginTop: "5rem" }}
//               value={message ?? ""}
//               onChange={(e) => setMessage(e.target.value)}
//             />
//             <button onClick={() => sendPicksReminder(tournament, teams)}>
//               Test Web Push
//             </button>
//           </>
//         ) : null}
//         <div className="">
//           <span>Push subscription:</span>
//         </div>
//         <code className="">
//           {subscription
//             ? JSON.stringify(subscription?.toJSON(), undefined, 2)
//             : "There is no subscription"}
//         </code>
//       </div>
//     </main>
//   );
// }

export default function page() {
  return <div></div>;
}
