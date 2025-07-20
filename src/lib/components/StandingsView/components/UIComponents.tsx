/**
 * UI Components - Small reusable UI elements
 *
 * Consolidates small, related UI components that work together
 * while maintaining clear separation of concerns.
 */

import { cn, formatMoney, formatRank } from "@pgc-utils";
import type { Tour, Tier } from "@prisma/client";
import type { Dispatch, SetStateAction } from "react";
import { ToursToggleButton } from "../../functional/ToursToggle";

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

export interface StandingsHeaderProps {
  standingsToggle: string;
  displayedTour: Tour | undefined;
}

/**
 * Main header for standings pages
 */
export function StandingsHeader({
  standingsToggle,
  displayedTour,
}: StandingsHeaderProps) {
  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : displayedTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view their stats and tournament history
      </div>
    </>
  );
}

// ============================================================================
// TOGGLE COMPONENTS
// ============================================================================

export interface ToursToggleProps {
  tours: Tour[];
  standingsToggle: string;
  setStandingsToggle: Dispatch<SetStateAction<string>>;
}

/**
 * Tour selection toggle buttons
 */
export function ToursToggle({
  tours,
  standingsToggle,
  setStandingsToggle,
}: ToursToggleProps) {
  if ((tours?.length ?? 0) <= 1) return null;

  return (
    <div className="mx-auto mt-4 flex w-full flex-row items-center justify-center gap-4 text-center">
      {tours
        ?.sort((a, b) => a.shortForm.localeCompare(b.shortForm))
        .map((tour) => (
          <ToursToggleButton
            key={"toggle-" + tour.id}
            tour={tour}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        ))}
      <ToursToggleButton
        key={"toggle-playoffs"}
        tour={{
          id: "playoffs",
          shortForm: "Playoffs",
          logoUrl:
            "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
        }}
        tourToggle={standingsToggle}
        setTourToggle={setStandingsToggle}
      />
    </div>
  );
}

/**
 * Friends Only Toggle Component
 */
export interface FriendsOnlyToggleProps {
  friendsOnly: boolean;
  setFriendsOnly: (value: boolean) => void;
  disabled?: boolean;
}

export function FriendsOnlyToggle({
  friendsOnly,
  setFriendsOnly,
  disabled = false,
}: FriendsOnlyToggleProps) {
  return (
    <div className="flex items-center justify-end">
      <div className="flex flex-col items-center justify-center p-2">
        <label htmlFor="friends-only-toggle" className="font-barlow text-xs">
          Friends
        </label>
        <button
          id="friends-only-toggle"
          type="button"
          role="switch"
          aria-checked={friendsOnly}
          disabled={disabled}
          onClick={() => setFriendsOnly(!friendsOnly)}
          className={cn(
            "relative inline-flex h-3 w-6 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50",
            friendsOnly ? "bg-slate-600" : "bg-gray-300",
          )}
        >
          <span
            className={cn(
              "inline-block h-2 w-2 transform rounded-full bg-white transition-transform",
              friendsOnly ? "translate-x-3.5" : "translate-x-1",
            )}
          />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// POPOVER COMPONENTS
// ============================================================================

export interface PointsAndPayoutsPopoverProps {
  tier: Tier | null | undefined;
}

/**
 * Points and payouts popover content
 */
export function PointsAndPayoutsPopover({
  tier,
}: PointsAndPayoutsPopoverProps) {
  return (
    <div className="grid w-full grid-cols-3 text-center">
      <div className="mx-auto flex flex-col">
        <div className="text-base font-semibold text-white">Rank</div>
        {tier?.payouts.slice(0, 35).map((_, i) => (
          <div key={i} className="text-xs">
            {formatRank(i + 1)}
          </div>
        ))}
      </div>
      <div className="col-span-2 mx-auto flex flex-col">
        <div className="text-base font-semibold">Payouts</div>
        {tier?.payouts.slice(0, 35).map((payout) => (
          <div key={"payout-" + payout} className="text-xs">
            {formatMoney(payout)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STATE COMPONENTS
// ============================================================================

import { LoadingSpinner } from "src/lib/components/functional/ui";

export interface StandingsErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Error state component
 */
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

/**
 * Loading skeleton component
 */
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
