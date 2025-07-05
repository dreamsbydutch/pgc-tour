/**
 * ChampionSectionSkeleton Component
 *
 * Displays a loading skeleton for a single champion section
 * Mimics the structure of the ChampionSection component
 */
export function ChampionSectionSkeleton() {
  return (
    <div className="m-3 rounded-2xl bg-amber-100 bg-opacity-70 shadow-lg md:w-10/12 lg:w-7/12">
      <div className="mx-auto max-w-3xl py-4 text-center">
        {/* Title skeleton */}
        <div className="flex items-center justify-center px-3 font-varela text-2xl font-bold sm:text-3xl md:text-4xl">
          <div className="h-16 w-16 animate-pulse rounded-full bg-amber-200" />
          <div className="ml-2 h-10 w-48 animate-pulse rounded bg-amber-200" />
        </div>
        {/* Champion section */}{" "}
        {[0, 1].map((_obj, i) => (
          <ChampionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ChampionSkeleton() {
  return (
    <div className="block">
      <div className="my-2 w-full border-b border-slate-800" />
      <div className="flex items-center justify-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-amber-200" />
        <div className="h-8 w-28 animate-pulse rounded bg-amber-200" />
        <div className="h-8 w-16 animate-pulse rounded bg-amber-200" />
      </div>

      {/* Team golfers skeleton grid */}
      <div className="mx-4 my-1 grid grid-cols-2 items-center justify-center gap-x-4 gap-y-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
          <div key={i} className="grid grid-cols-9 items-center justify-center">
            <div className="col-span-7 h-4 w-full animate-pulse rounded bg-amber-200" />
            <div className="h-4 w-full" />
            <div className="h-4 w-full animate-pulse rounded bg-amber-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
