import { Skeleton } from "@/ui/skeleton";

export function LeaderboardListSkeleton() {
  const list = new Array(75).fill(1);
  return (
    <>
      {list.map((obj, i) => (
        <LeaderboardListSkeletonItem key={i} />
      ))}
    </>
  );
}

function LeaderboardListSkeletonItem() {
  return (
    <div className="grid grid-flow-row grid-cols-10 py-1 text-center">
      <div className="font-varela col-span-2 mx-1 place-self-center text-sm">
        <Skeleton className="h-[1.5rem] w-full rounded-3xl" />
      </div>
      <div className="font-varela col-span-4 mx-1 place-self-center text-base">
        <Skeleton className="h-[1.5rem] w-full rounded-3xl" />
      </div>
      <div className="font-varela col-span-2 mx-1 place-self-center text-sm">
        <Skeleton className="h-[1.5rem] w-full rounded-3xl" />
      </div>
      <div className="font-varela text-2xs col-span-1 mx-1 place-self-center">
        <Skeleton className="h-[1.5rem] w-full rounded-3xl" />
      </div>
      <div className="font-varela text-2xs col-span-1 mx-1 place-self-center whitespace-nowrap">
        <Skeleton className="h-[1.5rem] w-full rounded-3xl" />
      </div>
    </div>
  );
}
