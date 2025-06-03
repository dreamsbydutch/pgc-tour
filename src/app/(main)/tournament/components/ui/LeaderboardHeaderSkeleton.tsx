import { SVGSkeleton } from "@/ui/skeleton";

export function LeaderboardHeaderSkeleton() {
  return (
    <>
      <div className="mx-auto grid grid-flow-row grid-cols-10 gap-2 border-b-2 border-gray-800 py-4">
        <div className="col-span-3 row-span-4 place-self-center px-1">
          <SVGSkeleton className="h-[6rem] w-full rounded-3xl" />
        </div>
        <div className="col-span-5 row-span-2 place-self-center">
          <SVGSkeleton className="h-[3rem] w-full rounded-sm" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1rem] w-full rounded-xl" />
        </div>
        <div className="col-span-3 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-3 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
        <div className="col-span-2 row-span-1 place-self-center">
          <SVGSkeleton className="h-[1.5rem] w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
export function LeaderboardHeaderImageSkeleton() {
  return (
    <div className="col-span-3 row-span-4 place-self-center px-1">
      <SVGSkeleton className="h-[8rem] w-full rounded-3xl" />
    </div>
  );
}
