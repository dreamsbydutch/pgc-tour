"use client";

import type { Rule } from "../../types";

/**
 * RulesList Component
 *
 * Displays a list of rules with their details in a structured format.
 * Used within rule categories to show individual rules and sub-rules.
 */
interface RulesListProps {
  rules: Rule[];
  categoryIndex: number;
}

export function RulesList({ rules, categoryIndex }: RulesListProps) {
  return (
    <>
      {rules.map((rule, ruleIndex) => (
        <div key={`${categoryIndex}.${ruleIndex}`} className="py-2">
          <div className="text-center font-varela text-base xs:text-lg md:text-xl">
            {rule.ruleText}
          </div>
          {rule.details && (
            <ul className="pt-1">
              {rule.details.map((subrule, detailIndex) => (
                <li
                  key={`${categoryIndex + 1}.${ruleIndex + 1}.${detailIndex + 1}`}
                  className="py-1 text-center font-barlow text-sm xs:text-base md:text-base"
                >
                  {subrule}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}
