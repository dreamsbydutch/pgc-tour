import { cn } from "@pgc-utils";
import { LoadingSpinner } from "src/lib/components/functional/ui";

// Simple loading card for PGC standings
export function StandingsLoadingSkeleton() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          {/* Loading spinner */}
          <div className="mb-6 flex justify-center">
            <LoadingSpinner className="h-12 w-12 text-slate-600" />
          </div>

          {/* Main loading message */}
          <h2 className="mb-3 font-yellowtail text-3xl text-slate-800">
            Loading PGC Standings
          </h2>

          {/* Subtitle */}
          <p className="font-varela text-sm text-slate-600">
            Gathering the latest tournament results and rankings...
          </p>

          {/* Animated dots */}
          <div className="mt-4 flex justify-center space-x-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
