"use client";

import type { RuleCategoryProps } from "../types";
import { CollapsibleSection, RulesList } from "../components/ui";
import { PayoutsTable, PointsTable, ScheduleTable } from "../components/tables";

/**
 * RuleCategory Component
 *
 * Displays a collapsible section of the rulebook with rules and dynamic content.
 * Handles special cases for Schedule, Payouts, and Scoring categories that include tables.
 */
export function RuleCategory({ ruleData, i }: RuleCategoryProps) {
  const renderCategoryContent = () => (
    <>
      <RulesList rules={ruleData.rules} categoryIndex={i} />
      {ruleData.category === "Schedule" && <ScheduleTable />}
      {ruleData.category === "Payouts" && <PayoutsTable />}
      {ruleData.category === "Scoring" && <PointsTable />}
    </>
  );

  return (
    <CollapsibleSection title={ruleData.category}>
      {renderCategoryContent()}
    </CollapsibleSection>
  );
}
