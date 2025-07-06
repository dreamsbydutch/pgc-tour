export function HomePageListSkeleton() {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center">
        <div className="mr-2 h-8 w-8 animate-pulse rounded-full bg-slate-300"></div>
        <div className="h-6 w-24 animate-pulse rounded-md bg-slate-300"></div>
      </div>
      <div className="mx-1 mb-3">
        {Array.from({ length: 15 }).map((_, idx) => (
          <TeamListingSkeleton key={idx} />
        ))}
      </div>
    </>
  );
}
function TeamListingSkeleton() {
  return (
    <div className="grid grid-cols-8 items-center justify-center rounded-md py-0.5 text-center">
      <div className="col-span-1 mx-auto h-4 w-4 animate-pulse rounded-sm bg-slate-300"></div>
      <div className="col-span-5 mx-auto h-4 w-full max-w-[85%] animate-pulse rounded-sm bg-slate-300"></div>
      <div className="col-span-2 mx-auto h-4 w-10 animate-pulse rounded-sm bg-slate-300"></div>
    </div>
  );
}
