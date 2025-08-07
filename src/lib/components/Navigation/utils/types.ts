/**
 * Types for Navigation components
 */

import type { LucideIcon } from "lucide-react";

export interface NavigationUser {
  id: string;
  email: string;
  avatar?: string;
}

export interface NavigationMember {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  role: string;
  account: number;
  friends: string[];
}

export interface NavigationTourCard {
  appearances: number;
  win: number;
  topTen: number;
  points: number;
  earnings: number;
}

export interface NavigationChampion {
  id: number;
  tournament: {
    name: string;
    logoUrl: string | null;
    startDate: Date;
    currentRound: number | null;
  };
}

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface NavigationError {
  code: string;
  message: string;
  retry?: () => void;
}

export interface NavigationData {
  user: NavigationUser | null;
  member: NavigationMember | null;
  tourCards: NavigationTourCard[];
  champions: NavigationChampion[];
  isLoading: boolean;
  tourCardLoading: boolean;
  error: NavigationError | null;
  hasNetworkError: boolean;
  retryCount: number;
}

export interface NavigationProviderProps {
  children: React.ReactNode;
}

export interface NavigationContainerProps {
  className?: string;
}
