import {
  Skeleton,
  SVGSkeleton,
} from "@pgc-ui";

/**
 * LeagueScheduleSkeleton
 *
 * A loading skeleton that mimics the look and feel of the LeagueSchedule component.
 * Uses Skeleton and SvgSkeleton components for shimmer/animated placeholders.
 */
export function LeagueScheduleSkeleton({ rows = 16 }: { rows?: number }) {
  return (
    <div className="-lg m-1 animate-pulse border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <SVGSkeleton className="-full h-14 w-14" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="overflow-x-auto">
          <table className="w-full font-varela">
            <thead>
              <tr>
                <th className="span text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-20" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-16" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-12" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-16" />
                </th>
                <th className="border-l text-center text-xs font-bold">
                  <Skeleton className="mx-auto h-4 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="min-w-48 text-xs">
                    <div className="flex items-center justify-evenly gap-1 text-center">
                      <SVGSkeleton className="h-8 w-8 object-contain" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-20" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-12" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-16" />
                  </td>
                  <td>
                    <Skeleton className="mx-auto h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
