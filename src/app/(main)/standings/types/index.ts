import type { Tour, TourCard, Tier } from "@prisma/client";

/**
 * Props for tour toggle button component
 */
export interface ToursToggleButtonProps {
  tour: Tour;
  tourToggle: string;
  setTourToggle: (tourId: string) => void;
}

/**
 * Props for standings header components
 */
export interface StandingsHeaderProps {
  tier?: Tier;
}

/**
 * Props for standings listing components
 */
export interface StandingsListingProps {
  tourCard: TourCard;
}

/**
 * Props for playoff standings listing components
 */
export interface PlayoffStandingsListingProps {
  tourCard: TourCard;
  teams: TourCard[];
  strokes: number[];
}

/**
 * Props for tour standings component
 */
export interface TourStandingsProps {
  activeTour: Tour | undefined;
}

/**
 * Props for playoff standings component
 */
export interface PlayoffStandingsProps {
  tours: Tour[] | null;
}

/**
 * Props for main standings view
 */
export interface StandingsMainViewProps {
  searchParams: Record<string, string>;
}

/**
 * Props for tour card info component
 */
export interface StandingsTourCardInfoProps {
  tourCard: TourCard;
}

/**
 * Standings toggle state type
 */
export type StandingsToggleType = string;

/**
 * Points and payouts popover props
 */
export interface PointsAndPayoutsPopoverProps {
  tier: Tier | null | undefined;
}
