// Rulebook Module Index
// Main barrel export for the rulebook module

// Components
export {
  PayoutsTable,
  PointsTable,
  ScheduleTable,
  DataTable,
  CollapsibleSection,
  RulesList,
} from "./components";

// Views
export { RuleCategory, RulebookMainView } from "./views";

// Types
export type {
  Rule,
  RuleCategory as RuleCategoryType,
  TableComponentProps,
  PayoutsTableProps,
  PointsTableProps,
  ScheduleTableProps,
  CollapsibleSectionProps,
  RuleCategoryProps,
  TournamentWithCourse,
  DataTableProps,
} from "./types";

// Utils
export {
  createSilverTier,
  sortTiersByPayout,
  getTierDisplayName,
  isPlayoffTier,
  isSilverTier,
  getTierStyling,
  getRulebookData,
} from "./utils";
