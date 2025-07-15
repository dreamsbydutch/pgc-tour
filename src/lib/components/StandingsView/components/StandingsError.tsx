import { cn } from "@pgc-utils";

export interface StandingsErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

export function StandingsError({ error, onRetry }: StandingsErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      {/* Error Icon */}
      <div className="mb-6">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          {/* Animated ripple effect */}
          <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-25"></div>
        </div>
      </div>

      {/* Error Message */}
      <div className="max-w-md text-center">
        <h3 className="mb-2 font-yellowtail text-xl font-semibold text-gray-900">
          Oops! Something went wrong
        </h3>
        <p className="mb-6 font-varela text-gray-600">
          {error ??
            "We couldn't load the standings right now. Please try again."}
        </p>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "inline-flex items-center rounded-lg px-4 py-2",
            "bg-blue-500 font-varela text-white hover:bg-blue-600",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          )}
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}

      {/* Decorative elements */}
      <div className="absolute left-8 top-8 h-2 w-2 animate-pulse rounded-full bg-red-200"></div>
      <div
        className="absolute right-12 top-12 h-3 w-3 animate-pulse rounded-full bg-red-300"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="absolute bottom-16 left-16 h-1 w-1 animate-pulse rounded-full bg-red-400"
        style={{ animationDelay: "1s" }}
      ></div>
    </div>
  );
}
