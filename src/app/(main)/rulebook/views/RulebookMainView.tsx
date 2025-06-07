"use client";

import { getRulebookData } from "../utils";
import { RuleCategory } from "./RuleCategory";

/**
 * RulebookMainView Component
 *
 * The main view component for the rulebook page.
 * Displays the rulebook header and all rule categories.
 */
export function RulebookMainView() {
  const rulebook = getRulebookData();

  return (
    <>
      <div className="pb-4 pt-2 text-center font-yellowtail text-7xl lg:text-[5.5rem]">
        Rulebook
      </div>
      <div className="mx-auto w-full border-2 border-b border-slate-600"></div>
      {rulebook.map((section, i) => (
        <RuleCategory key={i} ruleData={section} i={i} />
      ))}
    </>
  );
}
