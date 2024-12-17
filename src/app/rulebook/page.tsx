"use client";
import { cn, formatMoney, formatNumber, formatRank } from "@/lib/utils";
import { api } from "@/src/trpc/react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../_components/ui/table";
import { Tier } from "@prisma/client";

export default function RulebookPage() {
  const season = api.season.getCurrent.useQuery();
  const tiers = api.tier.getBySeason.useQuery({
    seasonId: season.data?.id || "",
  });
  if (!tiers.data || !season.data) return null;
  return (
    <>
      <div className="pb-4 pt-2 text-center font-yellowtail text-7xl lg:text-[5.5rem]">
        Rulebook
      </div>
      <div className="mx-auto w-full border-2 border-b border-slate-600"></div>
      {rulebook.map((section, i) => (
        <>
          <RuleCategory
            key={i}
            {...{ ruleData: section, i, tiers: tiers.data }}
          />
        </>
      ))}
    </>
  );
}

function RuleCategory({
  ruleData,
  i,
  tiers,
}: {
  ruleData: RuleCategory;
  i: number;
  tiers: Tier[];
}) {
  const [showState, setShowState] = useState(false);
  return (
    <div className="mx-auto border-b-2 border-slate-500">
      <div
        className="py-5 text-center font-varela text-2xl font-extrabold md:text-3xl"
        onClick={() => setShowState(!showState)}
      >
        {ruleData.category}
        <span className="inline-flex pl-2">
          {showState ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </div>
      <div className={cn("hidden pb-8", showState && "block")}>
        {ruleData.rules.map((rule, j) => {
          return (
            <div key={i + "." + j} className="py-2">
              <div className="text-center font-varela text-sm sm:text-base md:text-lg lg:text-xl">
                {rule.ruleText}
              </div>
              {rule.details && (
                <ul className="pt-1">
                  {rule.details.map((subrule, k) => {
                    return (
                      <li
                        key={`${i + 1}.${j + 1}.${k + 1}`}
                        className="py-1 text-center font-barlow text-xs sm:text-sm md:text-base lg:text-lg"
                      >
                        {subrule}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {ruleData.category === "Payouts" && <PayoutsTable tiers={tiers} />}
        {ruleData.category === "Scoring" && <PointsTable tiers={tiers} />}
      </div>
    </div>
  );
}

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
          "These 16 tournaments are split in to three categories, Majors, Elevated, and Standard.",
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
          "The Genesis Invitational, Arnold Palmer Inviational, The Players Championship, RBC Heritage, Wells Fargo Championship, The Memorial Torunament",
        ],
      },
      {
        ruleText: "Standard Events",
        details: [
          "Waste Management Open, Valero Texas Open, The CJ Cup Byron Nelson, RBC Canadian Open, Travelers Championship, Genesis Scottish Open",
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
      },
      {
        ruleText:
          "Players choose 2 golfers from each of the 5 groups to create their 10 golfer team for the tournament. New teams are created prior to each tournament on the schedule.",
      },
      {
        ruleText:
          "Golfers that are added to the PGA tournament field after the groups are set will be left out of the PGC field.",
      },
      {
        ruleText:
          "If a golfer withdraws prior to hitting their first tee shot of the tournament and remains on your roster when the tournament begins, that golfer will be replaced with the highest available world ranked golfer from their group.",
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
          " Any golfer that withdraws from the tournament prior to cut day will receive a score of 8-over par until cut day. Any golfer that withdraws after cut day receives a score of 8-over par if they do not finish the round and then are considered CUT on the days they do not participate at all.",
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
          "At the end of the regular season the top 15 players on each tour qualify for the PGC Gold Playoff tournament and the next 15 players on each tour qualify for the PGC Silver Playoff Tournament.",
      },
      {
        ruleText:
          "The winner of the PGC Gold Playoff will be crowned PGC Champion for the year. The PGC Silver Playoff is for bonus money and bragging rights.",
      },
      {
        ruleText:
          "Each PGC Playoff tournament is 12-rounds long and played across all three FedEx Cup Playoff events (FedEx-StJude Championship, BMW Championship, TOUR Championship).",
      },
      {
        ruleText:
          "Players that qualify will pick their 10-golfer team for the entire three-week playoffs prior to the first event.",
      },
      {
        ruleText:
          "The FedEx-StJude Championship runs just like a normal tournament.",
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
          "After each tournament the top finishers will earn money. Earnings accumulate throughout the season and will be paid out at the end of the year.",
      },
      {
        ruleText:
          "Payout structures for each tournament are based on the tournament's tier and will be finalized once sign ups are completed.",
      },
    ],
  },
];

function PayoutsTable({ tiers }: { tiers: Tier[] }) {
  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        Payouts Distributions
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Finish
            </TableHead>
            {tiers.map((tier) => (
              <TableHead
                className="text-center text-xs font-bold"
                key={`payouts-${tier.id}`}
              >
                {tier.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers[0]?.payouts.slice(0, 15).map((obj, i) => (
            <TableRow>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className="text-center text-xs"
                  key={`payouts-${tier.id}`}
                >
                  {formatMoney(tier.payouts[i] || 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function PointsTable({ tiers }: { tiers: Tier[] }) {
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
            {tiers.map((tier) => (
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
          {tiers[0]?.points.slice(0, 35).map((obj, i) => (
            <TableRow>
              <TableCell className="text-sm font-bold">
                {formatRank(i + 1)}
              </TableCell>
              {tiers.map((tier) => (
                <TableCell
                  className="text-center text-xs"
                  key={`points-${tier.id}`}
                >
                  {formatNumber(tier.points[i] || 0)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
