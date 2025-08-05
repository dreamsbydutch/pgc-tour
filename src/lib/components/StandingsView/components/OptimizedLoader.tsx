/**
 * Optimized loading states for better perceived performance
 */

import { Skeleton } from "@/components/ui/skeleton";

export function OptimizedStandingsLoader() {
  return (
    <div className="w-full space-y-4">
      {/* Header skeleton - shows immediately */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Tour toggle skeleton */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-20" />
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-6 gap-4 p-2">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Table rows with staggered animation */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-4 p-2"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
