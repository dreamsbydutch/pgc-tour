"use client";

<<<<<<< Updated upstream
import { cn, formatMoney, formatNumber, formatRank } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../_components/ui/table";
import Image from "next/image";
import { useMainStore } from "@/src/lib/store/store";

/**
 * RulebookPage Component
 *
 * Displays the rulebook for the PGC Tour.
 * - Includes sections for schedule, rosters, scoring, playoffs, and payouts.
 * - Dynamically fetches data for the current season and tiers.
 */
export default function RulebookPage() {
  return (
    <>
      <div className="pb-4 pt-2 text-center font-yellowtail text-7xl lg:text-[5.5rem]">
        Rulebook
      </div>
      <div className="mx-auto w-full border-2 border-b border-slate-600"></div>
      {rulebook.map((section, i) => (
        <RuleCategory
          key={i}
          {...{
            ruleData: section,
            i,
          }}
        />
      ))}
    </>
=======
import { useState } from "react";
import { CategorySection, type RuleCategory } from "./reusable-components";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

// Complete original rulebook data - ALL RULES PRESERVED
const RULEBOOK_DATA: RuleCategory[] = [
  {
    category: "Schedule",
    rules: [
      {
        ruleText:
          "The PGC Tour schedule consists of the top 16 tournaments on the PGA Tour schedule.",
      },
      {
        ruleText:
          "These 16 tournaments are split into three categories: Majors, Elevated, and Standard.",
      },
      {
        ruleText: "Major Tournaments",
        details: [
          "The Masters, PGA Championship, U.S. Open, The Open Championship",
        ],
      },
      {
        ruleText: "Elevated Events",
        details: [
          "Arnold Palmer Invitational, The Players Championship, RBC Heritage, Truist Championship, The Memorial Tournament, Travelers Championship",
        ],
      },
      {
        ruleText: "Standard Events",
        details: [
          "Waste Management Open, The Genesis Invitational, Texas Children's Houston Open, RBC Canadian Open, Rocket Mortgage Classic, Genesis Scottish Open",
        ],
      },
      {
        ruleText:
          "Each tier of tournaments has a different points and payouts structure.",
      },
    ],
  },
  {
    category: "Rosters",
    rules: [
      {
        ruleText:
          "The field for each tournament will be split into five groups. Groups are finalized the Monday morning prior to each tournament.",
        details: [
          "Until further notice, Scottie Scheffler has been removed from play for being unhuman.",
        ],
      },
      {
        ruleText:
          "Players choose 2 golfers from each of the 5 groups to create their 10-golfer team for the tournament. New teams are created prior to each tournament on the schedule.",
      },
      {
        ruleText:
          "Golfers that are added to the PGA tournament field after the groups are set will be left out of the PGC field.",
      },
      {
        ruleText:
          "If a golfer withdraws prior to hitting their first tee shot of the tournament and remains on your roster when the tournament begins, that golfer will be replaced with the highest available world-ranked golfer from their group.",
      },
    ],
  },
  {
    category: "Scoring",
    rules: [
      {
        ruleText:
          "During rounds 1 and 2 of the tournament, each team's score will be the average scores of all 10 golfers on your team.",
        details: ["Each PGA stroke equates to 0.1 PGC strokes."],
      },
      {
        ruleText:
          "During rounds 3 and 4 of the tournament, each team's score will be the average scores of the 5 lowest golfers on your team that day.",
        details: ["Each PGA stroke equates to 0.2 PGC strokes."],
      },
      {
        ruleText:
          "Teams must have 5 golfers make the weekend cut or that team will be cut from the PGC tournament.",
      },
      {
        ruleText:
          "Any golfer that withdraws from the tournament prior to cut day will receive a score of 8-over par until cut day. Any golfer that withdraws after cut day receives a score of 8-over par if they do not finish the round and then are considered CUT on the days they do not participate at all.",
      },
      {
        ruleText:
          "After each tournament throughout the season, the top 35 finishers will receive PGC Cup Points. Each tournament will distribute points based on the tournament's tier.",
      },
    ],
  },
  {
    category: "Playoffs",
    rules: [
      {
        ruleText:
          "At the end of the regular season, the top 15 players on each tour qualify for the PGC Gold Playoff tournament, and the next 20 players on each tour qualify for the PGC Silver Playoff Tournament.",
      },
      {
        ruleText:
          "The winner of the PGC Gold Playoff will be crowned PGC Champion for the year. The PGC Silver Playoff is for bonus money and bragging rights.",
      },
      {
        ruleText:
          "Each PGC Playoff tournament is 12 rounds long and played across all three FedEx Cup Playoff events (FedEx-St. Jude Championship, BMW Championship, TOUR Championship).",
      },
      {
        ruleText:
          "Players that qualify will pick their 10-golfer team for the entire three-week playoffs prior to the first event.",
      },
      {
        ruleText:
          "The FedEx-St. Jude Championship runs just like a normal tournament.",
      },
      {
        ruleText:
          "The BMW Championship only counts your top 5 golfers in each of the 4 rounds.",
      },
      {
        ruleText:
          "The TOUR Championship only counts your top 3 golfers in each of the 4 rounds.",
        details: [
          "The TOUR Championship only counts a golfer's actual score and not their starting strokes awarded by the PGA.",
        ],
      },
    ],
  },
  {
    category: "Payouts",
    rules: [
      {
        ruleText:
          "After each tournament, the top finishers will earn money. Earnings accumulate throughout the season and will be paid out at the end of the year.",
      },
      {
        ruleText:
          "Payout structures for each tournament are based on the tournament's tier and will be finalized once sign-ups are completed.",
      },
    ],
  },
];

// Super simplified main component using reusable components
export default function RulebookPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionTitle: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionTitle)) {
      newOpenSections.delete(sectionTitle);
    } else {
      newOpenSections.add(sectionTitle);
    }
    setOpenSections(newOpenSections);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Original styling preserved */}
      <div className="pb-4 pt-2 text-center font-yellowtail text-7xl lg:text-[5.5rem]">
        Rulebook
      </div>
      <div className="mx-auto mb-6 w-full border-2 border-b border-slate-600"></div>

      {/* Ultra-simple structure with reusable components */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {RULEBOOK_DATA.map((category) => (
          <CategorySection
            key={category.category}
            category={category}
            isOpen={openSections.has(category.category)}
            onToggle={() => toggleSection(category.category)}
          />
        ))}
      </div>
    </div>
>>>>>>> Stashed changes
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
function RuleCategory({ ruleData, i }: { ruleData: RuleCategory; i: number }) {
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
        {ruleData.category === "Schedule" && (
          <>
            <div className="mt-4 text-center font-varela font-bold">
              2025 PGC Schedule
            </div>
            <CurrentSchedule />
          </>
        )}
        {ruleData.category === "Payouts" && <PayoutsTable />}
        {ruleData.category === "Scoring" && <PointsTable />}
      </div>
    </div>
  );
}

/**
 * PayoutsTable Component
 *
 * Displays the payouts distribution table for each tier.
 *
 * Props:
 * - tiers: The list of tiers for the season.
 */
function PayoutsTable() {
  let tiers = useMainStore((state) => state.currentTiers)?.sort(
    (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
  );
  tiers = [
    ...(tiers ?? []),
    {
      payouts: tiers?.[3]?.payouts.slice(75) ?? [],
      points: tiers?.[3]?.points.slice(75) ?? [],
      name: "Silver",
      seasonId: tiers?.[3]?.seasonId ?? "",
      id: "silver",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Payouts Distributions
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers.map((tier) => (
              <TableHead
                className={cn(
                  "text-center text-xs font-bold",
                  tier.name === "Playoff" &&
                    "border-l border-l-slate-500 bg-yellow-50 bg-opacity-50",
                  tier.name === "Silver" && "bg-gray-100 bg-opacity-50",
                )}
                key={`payouts-${tier.id}`}
              >
                {tier.name === "Playoff" ? "Gold" : tier.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers[0]?.payouts.slice(0, 30).map((_obj, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className={cn(
                    "border-l text-center text-xs",
                    tier.name === "Playoff" &&
                      "border-l-slate-500 bg-yellow-50 bg-opacity-50",
                    tier.name === "Silver" && "bg-gray-100 bg-opacity-50",
                  )}
                  key={`payouts-${tier.id}`}
                >
                  {formatMoney(tier.payouts[i] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

/**
 * PointsTable Component
 *
 * Displays the points distribution table for each tier.
 *
 * Props:
 * - tiers: The list of tiers for the season.
 */
function PointsTable() {
  const tiers = useMainStore((state) => state.currentTiers)?.sort(
    (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
  );
  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Points Distributions
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers?.map((tier) => (
              <TableHead
                className="text-center text-xs font-bold"
                key={`points-${tier.id}`}
              >
                {tier.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers?.[0]?.points.slice(0, 35).map((_obj, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className="border-l text-center text-xs"
                  key={`points-${tier.id}`}
                >
                  {i >= 30 && tier.name === "Playoff"
                    ? "-"
                    : formatNumber(tier.points[i] ?? 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

/**
 * Schedule Component
 *
 * Displays the schedule for the current season.
 *
 * Props:
 * - season: The current season data.
 */
function CurrentSchedule() {
  const tournaments = useMainStore((state) => state.seasonTournaments);
  const tiers = useMainStore((state) => state.currentTiers);

  return (
    <Table className="mx-auto w-3/4 text-center font-varela">
      <TableHeader>
        <TableRow>
          <TableHead className="span text-center text-xs font-bold">
            Tournament
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Dates
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Tier
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Course
          </TableHead>
          <TableHead className="border-l text-center text-xs font-bold">
            Location
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tournaments?.map((tourney, i) => {
          const tier = tiers?.find((t) => t.id === tourney.tierId);
          const start = new Date(tourney.startDate);
          const end = new Date(tourney.endDate);
          return (
            <TableRow
              key={tourney.id}
              className={cn(
                i === 16 ? "border-t-2 border-t-slate-500" : "",
                i >= 16 ? "bg-yellow-50" : "",
                tier?.name === "Major" ? "bg-blue-50" : "",
              )}
            >
              <TableCell className="flex items-center justify-center whitespace-nowrap text-center text-xs">
                <Image
                  src={tourney.logoUrl ?? ""}
                  className="pr-1"
                  alt={tourney.name}
                  width={25}
                  height={25}
                />
                {tourney.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {`${start.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} - ${
                  start.getMonth() === end.getMonth()
                    ? end.toLocaleDateString("en-US", {
                        day: "numeric",
                      })
                    : end.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                }`}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tier?.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course?.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course?.location}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/**
 * RuleCategory Interface
 *
 * Represents the structure of a rule category in the rulebook.
 * - category: The name of the rule category.
 * - rules: The list of rules in the category.
 * - picture (optional): An image associated with the category.
 */
interface RuleCategory {
  category: string;
  rules: {
    ruleText: string;
    details?: string[];
  }[];
  picture?: {
    url: string;
    altText: string;
  };
}

/**
 * Rulebook Data
 *
 * Contains the static data for the rulebook, including categories and rules.
 */
const rulebook: RuleCategory[] = [
  {
    category: "Schedule",
    rules: [
      {
        ruleText:
          "The PGC Tour schedule consists of the top 16 tournaments on the PGA Tour schedule.",
      },
      {
        ruleText:
          "These 16 tournaments are split into three categories: Majors, Elevated, and Standard.",
      },
      {
        ruleText: "Major Tournaments",
        details: [
          "The Masters, PGA Championship, U.S. Open, The Open Championship",
        ],
      },
      {
        ruleText: "Elevated Events",
        details: [
          "Arnold Palmer Invitational, The Players Championship, RBC Heritage, Truist Championship, The Memorial Tournament, Travelers Championship",
        ],
      },
      {
        ruleText: "Standard Events",
        details: [
          "Waste Management Open, The Genesis Invitational, Texas Children's Houston Open, RBC Canadian Open, Rocket Mortgage Classic, Genesis Scottish Open",
        ],
      },
      {
        ruleText:
          "Each tier of tournaments has a different points and payouts structure.",
      },
    ],
  },
  {
    category: "Rosters",
    rules: [
      {
        ruleText:
          "The field for each tournament will be split into five groups. Groups are finalized the Monday morning prior to each tournament.",
        details: [
          "Until further notice, Scottie Scheffler has been removed from play for being unhuman.",
        ],
      },
      {
        ruleText:
          "Players choose 2 golfers from each of the 5 groups to create their 10-golfer team for the tournament. New teams are created prior to each tournament on the schedule.",
      },
      {
        ruleText:
          "Golfers that are added to the PGA tournament field after the groups are set will be left out of the PGC field.",
      },
      {
        ruleText:
          "If a golfer withdraws prior to hitting their first tee shot of the tournament and remains on your roster when the tournament begins, that golfer will be replaced with the highest available world-ranked golfer from their group.",
      },
    ],
  },
  {
    category: "Scoring",
    rules: [
      {
        ruleText:
          "During rounds 1 and 2 of the tournament, each team's score will be the average scores of all 10 golfers on your team.",
        details: ["Each PGA stroke equates to 0.1 PGC strokes."],
      },
      {
        ruleText:
          "During rounds 3 and 4 of the tournament, each team's score will be the average scores of the 5 lowest golfers on your team that day.",
        details: ["Each PGA stroke equates to 0.2 PGC strokes."],
      },
      {
        ruleText:
          "Teams must have 5 golfers make the weekend cut or that team will be cut from the PGC tournament.",
      },
      {
        ruleText:
          "Any golfer that withdraws from the tournament prior to cut day will receive a score of 8-over par until cut day. Any golfer that withdraws after cut day receives a score of 8-over par if they do not finish the round and then are considered CUT on the days they do not participate at all.",
      },
      {
        ruleText:
          "After each tournament throughout the season, the top 35 finishers will receive PGC Cup Points. Each tournament will distribute points based on the tournament's tier.",
      },
    ],
  },
  {
    category: "Playoffs",
    rules: [
      {
        ruleText:
          "At the end of the regular season, the top 15 players on each tour qualify for the PGC Gold Playoff tournament, and the next 15 players on each tour qualify for the PGC Silver Playoff Tournament.",
      },
      {
        ruleText:
          "The winner of the PGC Gold Playoff will be crowned PGC Champion for the year. The PGC Silver Playoff is for bonus money and bragging rights.",
      },
      {
        ruleText:
          "Each PGC Playoff tournament is 12 rounds long and played across all three FedEx Cup Playoff events (FedEx-St. Jude Championship, BMW Championship, TOUR Championship).",
      },
      {
        ruleText:
          "Players that qualify will pick their 10-golfer team for the entire three-week playoffs prior to the first event.",
      },
      {
        ruleText:
          "The FedEx-St. Jude Championship runs just like a normal tournament.",
      },
      {
        ruleText:
          "The BMW Championship only counts your top 5 golfers in each of the 4 rounds.",
      },
      {
        ruleText:
          "The TOUR Championship only counts your top 3 golfers in each of the 4 rounds.",
        details: [
          "The TOUR Championship only counts a golfer's actual score and not their starting strokes awarded by the PGA.",
        ],
      },
    ],
  },
  {
    category: "Payouts",
    rules: [
      {
        ruleText:
          "After each tournament, the top finishers will earn money. Earnings accumulate throughout the season and will be paid out at the end of the year.",
      },
      {
        ruleText:
          "Payout structures for each tournament are based on the tournament's tier and will be finalized once sign-ups are completed.",
      },
    ],
  },
];
