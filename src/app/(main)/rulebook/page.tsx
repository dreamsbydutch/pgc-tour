"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { ruleList } from "@app/(main)/rulebook/rules";
import { cn } from "@pgc-utils";
import { LeagueSchedule, PayoutsTable, PointsTable } from "@pgc-components";
import type { Course, Tier, Tournament } from "@prisma/client";
import { useTiers } from "@pgc-store";
import { useCurrentSchedule } from "@pgc-hooks";

/**
 * RulebookPage Component
 *
 * Displays the rulebook for the PGC Tour.
 * - Includes sections for schedule, rosters, scoring, playoffs, and payouts.
 * - Dynamically fetches data for the current season and tiers.
 */
export default function RulebookPage() {
  const schedule: {
    tournaments: Array<Tournament & { course: Course; tier: Tier }>;
    isLoading: boolean;
    error: unknown;
  } = useCurrentSchedule();
  const tiers = useTiers();
  return (
    <>
      <div className="pb-4 pt-2 text-center font-yellowtail text-7xl lg:text-[5.5rem]">
        Rulebook
      </div>
      <div className="mx-auto w-full border-2 border-b border-slate-600"></div>
      {ruleList.map((section, i) => (
        <RuleCategory
          key={i}
          {...{
            ruleData: section,
            i,
            schedule:
              section.category === "Schedule"
                ? schedule.tournaments
                : undefined,
            tiers:
              section.category === "Payouts" || section.category === "Scoring"
                ? tiers
                : undefined,
          }}
        />
      ))}
    </>
  );
}

/**
 * RuleCategory Component
 *
 * Displays a collapsible section of the rulebook.
 * - Includes rules, details, and dynamic content for specific categories.
 *
 * Props:
 * - ruleData: The data for the rule category.
 * - i: The index of the rule category.
 * - season: The current season data.
 * - tiers: The list of tiers for the season.
 */
function RuleCategory({
  ruleData,
  i,
  schedule,
  tiers,
}: {
  ruleData: {
    category: string;
    rules: {
      ruleText: string;
      details?: string[];
    }[];
    picture?: {
      url: string;
      altText: string;
    };
  };
  i: number;
  schedule?:
    | {
        id: string;
        name: string;
        logoUrl: string | null;
        startDate: Date;
        endDate: Date;
        seasonId: string;
        tier: {
          name: string;
        };
        course: {
          name: string;
          location: string;
        };
      }[]
    | null;
  tiers?:
    | {
        id: string;
        name: string;
        payouts: number[];
        points: number[];
      }[]
    | null;
}) {
  const [showState, setShowState] = useState(false);

  return (
    <div className="mx-auto border-b-2 border-slate-500">
      <div
        className="flex flex-row justify-center gap-2 py-5 text-center font-varela text-2xl font-extrabold xs:text-3xl md:text-4xl"
        onClick={() => setShowState(!showState)}
      >
        <div>{ruleData.category}</div>
        <div className="self-center">
          {showState ? (
            <ChevronUpIcon className="self-center" />
          ) : (
            <ChevronDownIcon className="self-center" />
          )}
        </div>
      </div>
      <div className={cn("hidden pb-8", showState && "block")}>
        {ruleData.rules.map((rule, j) => (
          <div key={i + "." + j} className="py-2">
            <div className="text-center font-varela text-base xs:text-lg md:text-xl">
              {rule.ruleText}
            </div>
            {rule.details && (
              <ul className="pt-1">
                {rule.details.map((subrule, k) => (
                  <li
                    key={`${i + 1}.${j + 1}.${k + 1}`}
                    className="py-1 text-center font-barlow text-sm xs:text-base md:text-base"
                  >
                    {subrule}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {ruleData.category === "Schedule" && schedule && (
          <LeagueSchedule tournaments={schedule} />
        )}
        {ruleData.category === "Payouts" && tiers && (
          <PayoutsTable tiers={tiers} />
        )}
        {ruleData.category === "Scoring" && tiers && (
          <PointsTable tiers={tiers} />
        )}
      </div>
    </div>
  );
}
