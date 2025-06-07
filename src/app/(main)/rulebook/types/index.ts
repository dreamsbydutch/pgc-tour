/**
 * Rulebook Types
 *
 * TypeScript interfaces and types for the rulebook module.
 */

import type { Tournament } from "@prisma/client";

/**
 * Rule interface for individual rules within a category
 */
export interface Rule {
  ruleText: string;
  details?: string[];
}

/**
 * RuleCategory interface for rulebook sections
 */
export interface RuleCategory {
  category: string;
  rules: Rule[];
  picture?: {
    url: string;
    altText: string;
  };
}

/**
 * Props for table components
 */
export interface TableComponentProps {
  className?: string;
}

/**
 * Props for the PayoutsTable component
 */
export interface PayoutsTableProps {
  className?: string;
}

/**
 * Props for the PointsTable component
 */
export interface PointsTableProps {
  className?: string;
}

/**
 * Props for the ScheduleTable component
 */
export interface ScheduleTableProps {
  className?: string;
}

/**
 * Props for collapsible section components
 */
export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Props for the RuleCategory component
 */
export interface RuleCategoryProps {
  ruleData: RuleCategory;
  i: number;
}

/**
 * Tournament with course data for schedule display
 */
export interface TournamentWithCourse extends Tournament {
  course: {
    name: string;
    location: string;
  } | null;
}

/**
 * Base DataTable props for reusable table component
 */
export interface DataTableProps {
  headers: string[];
  data: (string | React.ReactNode)[][];
  className?: string;
  headerClassNames?: string[];
  cellClassNames?: string[];
}
