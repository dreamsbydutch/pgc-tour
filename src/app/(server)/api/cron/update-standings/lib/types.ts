/**
 * Types for the update standings cron job
 */

import type { TourCard, Team, Tour, Season } from "@prisma/client";

// Core types
export type TourCardWithRelations = TourCard & {
  tour: Tour;
};

export type SeasonWithTourCards = Season & {
  tourCards: TourCardWithRelations[];
};

// Tour card calculation result
export interface TourCardCalculation {
  id: string;
  tourId: string;
  win: number;
  topTen: number;
  madeCut: number;
  appearances: number;
  earnings: number;
  points: number;
  position?: string;
}

// Update result
export interface UpdateResult {
  tourCardsUpdated: number;
  seasonProcessed: boolean;
  totalTourCards: number;
}

// Standard cron job result
export interface CronJobResult {
  success: boolean;
  message: string;
  data?: UpdateResult;
  error?: string;
  status?: number;
}
