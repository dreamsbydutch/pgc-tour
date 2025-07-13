/**
 * Types for Navigation components
 */

import type { LucideIcon } from "lucide-react";

export interface NavigationUser {
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
  };
}

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface NavigationData {
  user: NavigationUser | null;
  member: NavigationMember | null;
  tourCards: NavigationTourCard[];
  champions?: NavigationChampion[] | null;
  isLoading: boolean;
}

export interface NavigationProviderProps {
  children: React.ReactNode;
}

export interface NavigationContainerProps {
  className?: string;
}
