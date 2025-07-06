import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
// import { SVGSkeleton } from "@/ui/skeleton";

export function LeaderboardListSkeleton() {
  // const list = new Array(75).fill(1);
  return (
    <LoadingSpinner />
    // <div className="flex flex-col">
    //   <div className="mb-2 mt-6 flex flex-row items-center justify-around">
    //     <SVGSkeleton className="h-[1.5rem] w-1/5 rounded-3xl pb-3 pt-4" />
    //     <SVGSkeleton className="h-[1.5rem] w-1/5 rounded-3xl pb-3 pt-4" />
    //     <SVGSkeleton className="h-[1.5rem] w-1/5 rounded-3xl pb-3 pt-4" />
    //   </div>
    //   {list.map((_obj, i) => (
    //     <LeaderboardListSkeletonItem key={i} />
    //   ))}
    // </div>
  );
}

// function LeaderboardListSkeletonItem() {
//   return (
//     <div className="grid grid-flow-row grid-cols-10 py-1 text-center">
//       <div className="col-span-2 mx-1 place-self-center font-varela text-sm">
//         <SVGSkeleton className="h-[1.5rem] w-full rounded-3xl" />
//       </div>
//       <div className="col-span-4 mx-1 place-self-center font-varela text-base">
//         <SVGSkeleton className="h-[1.5rem] w-full rounded-3xl" />
//       </div>
//       <div className="col-span-2 mx-1 place-self-center font-varela text-sm">
//         <SVGSkeleton className="h-[1.5rem] w-full rounded-3xl" />
//       </div>
//       <div className="col-span-1 mx-1 place-self-center font-varela text-2xs">
//         <SVGSkeleton className="h-[1.5rem] w-full rounded-3xl" />
//       </div>
//       <div className="col-span-1 mx-1 place-self-center whitespace-nowrap font-varela text-2xs">
//         <SVGSkeleton className="h-[1.5rem] w-full rounded-3xl" />
//       </div>
//     </div>
//   );
// }
