"use client";
import { cn, formatMoney, formatNumber, formatRank } from "@/lib/utils";
import { api } from "@/src/trpc/react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../_components/ui/table";
import type { Season, Tier } from "@prisma/client";
import LoadingSpinner from "../_components/LoadingSpinner";
import Image from "next/image";

export default function RulebookPage() {
  const season = api.season.getCurrent.useQuery();
  const tiers = api.tier.getBySeason.useQuery({
    seasonId: season.data?.id ?? "",
  });
  if (!tiers.data) return <LoadingSpinner />;
  if (!season.data) return <LoadingSpinner />;
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
            {...{
              ruleData: section,
              i,
              season: season.data,
              tiers: tiers.data.sort(
                (a, b) => (a.payouts[0] ?? 0) - (b.payouts[0] ?? 0),
              ),
            }}
          />
        </>
      ))}
    </>
  );
}

function RuleCategory({
  ruleData,
  i,
  season,
  tiers,
}: {
  ruleData: RuleCategory;
  i: number;
  season: Season | null;
  tiers: Tier[];
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
        {ruleData.rules.map((rule, j) => {
          return (
            <div key={i + "." + j} className="py-2">
              <div className="text-center font-varela text-base xs:text-lg md:text-xl">
                {rule.ruleText}
              </div>
              {rule.details && (
                <ul className="pt-1">
                  {rule.details.map((subrule, k) => {
                    return (
                      <li
                        key={`${i + 1}.${j + 1}.${k + 1}`}
                        className="py-1 text-center font-barlow text-sm xs:text-base md:text-base"
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
        {ruleData.category === "Schedule" && <Schedule season={season} />}
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
  tiers = [
    ...tiers,
    {
      payouts: tiers[3]?.payouts.slice(75) ?? [],
      points: tiers[3]?.points.slice(75) ?? [],
      name: "Silver",
      seasonId: tiers[3]?.seasonId ?? "",
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
          {tiers[0]?.points.slice(0, 35).map((_obj, i) => (
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

function Schedule({ season }: { season: Season | null }) {
  if (!season) return <></>;
  const tournaments = api.tournament.getBySeason.useQuery({
    seasonId: season.id,
  }).data;
  if (!tournaments) return <></>;
  return (
    <>
      <div className="mt-4 text-center font-varela font-bold">
        2025 Schedule
      </div>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="border-l text-center text-xs font-bold"></TableHead>
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
          {tournaments.map((tourney, i) => (
            <TableRow
              key={tourney.id}
              className={cn(
                i === 16 ? "border-t-2 border-t-slate-500" : "",
                i >= 16 ? "bg-yellow-50" : "",
                tourney.tier.name === "Major" ? "bg-blue-50" : "",
              )}
            >
              <TableCell className="whitespace-nowrap text-center text-xs">
                <Image
                  src={tourney.logoUrl ?? ""}
                  alt={tourney.name}
                  width={25}
                  height={25}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap text-center text-xs">
                {tourney.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {`${tourney.startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} - ${
                  tourney.startDate.getMonth() === tourney.endDate.getMonth()
                    ? tourney.endDate.toLocaleDateString("en-US", {
                        day: "numeric",
                      })
                    : tourney.endDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                }`}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.tier.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course.name}
              </TableCell>
              <TableCell className="whitespace-nowrap border-l text-center text-xs">
                {tourney.course.location}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
