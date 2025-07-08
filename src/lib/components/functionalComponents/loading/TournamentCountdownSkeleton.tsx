/**
 * TournamentCountdownSkeleton Component
 *
 * Skeleton component displayed while the tournament data is being loaded.
 * - Shows placeholder elements that mimic the structure of the actual countdown.
 */
export function TournamentCountdownSkeleton() {
  return (
    <div className="mx-auto my-4 w-11/12 max-w-xl rounded-2xl bg-gray-100 p-2 shadow-md">
      <div className="flex flex-col items-center justify-center gap-1 px-3">
        <div className="h-8 w-5/6 max-w-lg animate-pulse rounded-lg bg-slate-200"></div>
        <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-lg bg-slate-200"></div>
      </div>
      <div className="my-3 flex items-center justify-center gap-2">
        <div className="h-16 w-16 animate-pulse rounded-lg bg-slate-200 xs:h-20 xs:w-20 md:h-28 md:w-28"></div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-row gap-1">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200"></div>
          </div>
          <div className="flex flex-row justify-center gap-1">
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
            <div className="h-3 w-6 animate-pulse rounded-lg bg-slate-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
