"use server";

import { Season } from "@prisma/client";
import { db } from "../../db";

export async function seedTiers() {
  const seasons = await db.season.findMany({});
  await seed2021Data(seasons.find((obj) => obj.year === 2021));
  await seed2022Data(seasons.find((obj) => obj.year === 2022));
  await seed2023Data(seasons.find((obj) => obj.year === 2023));
  await seed2024Data(seasons.find((obj) => obj.year === 2024));
}

const convertToArray = (obj: Record<string, string | number> | undefined) => {
  let i = 1;
  const output: number[] = [];
  while (i <= 75) {
    const x = String(i);
    output.push(obj && obj[x] ? +obj[x] : 0);
    i++;
  }
  return output;
};

const seed2024Data = async (season: Season | undefined) => {
  if (!season) return;
  const output: Record<string, string>[] = await fetch(
    "https://opensheet.elk.sh/1SSk7lg3Ym17lw8Hn-yZvT_erE9umRHPlrZJ8U4faBMY/Distributions",
  ).then((res) => res.json());
  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "BottomPayout")),
      points: convertToArray(output.find((obj) => obj.key === "BottomPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "MidPayout")),
      points: convertToArray(output.find((obj) => obj.key === "MidPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "MajorPayout")),
      points: convertToArray(output.find((obj) => obj.key === "MajorPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: [
        ...convertToArray(output.find((obj) => obj.key === "GoldPlayoff")),
        ...convertToArray(output.find((obj) => obj.key === "SilverPlayoff")),
      ],
      points: convertToArray(output.find((obj) => obj.key === "PlayoffStart")),
    },
  });
};

const seed2023Data = async (season: Season | undefined) => {
  if (!season) return;
  const output: Record<string, string>[] = await fetch(
    "https://opensheet.elk.sh/1EhRq77hWT0w_chnNVYhOq5_W_FQ--mPbliDyv3YHWG4/Distributions",
  ).then((res) => res.json());
  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "BottomPayout")),
      points: convertToArray(output.find((obj) => obj.key === "BottomPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "MidPayout")),
      points: convertToArray(output.find((obj) => obj.key === "MidPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: convertToArray(output.find((obj) => obj.key === "MajorPayout")),
      points: convertToArray(output.find((obj) => obj.key === "MajorPoints")),
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: convertToArray(
        output.find((obj) => obj.key === "PlayoffPayout"),
      ),
      points: convertToArray(output.find((obj) => obj.key === "PlayoffStart")),
    },
  });
};

const seed2022Data = async (season: Season | undefined) => {
  if (!season) return;
  const output: {
    Payout: string;
    BottomPayout: string;
    MidPayout: string;
    MajorPayout: string;
    PlayoffPayout: string;
    Points: string;
    BottomPoints: string;
    MidPoints: string;
    MajorPoints: string;
    PlayoffStart: string;
  }[] = await fetch(
    "https://opensheet.elk.sh/1ce6c0R9YggvfOxoilnZqqXfcAPxVKyaN0mly5_FOouk/Distributions",
  ).then((res) => res.json());
  const bottomPayout: number[] = Array(75).fill(0),
    midPayout: number[] = Array(75).fill(0),
    majorPayout: number[] = Array(75).fill(0),
    playoffPayout: number[] = Array(75).fill(0),
    bottomPoints: number[] = Array(75).fill(0),
    midPoints: number[] = Array(75).fill(0),
    majorPoints: number[] = Array(75).fill(0),
    playoffStart: number[] = Array(75).fill(0);

  output.forEach((obj) => {
    bottomPayout[+obj.Points - 1] = +obj.BottomPayout.replace("$", "");
    midPayout[+obj.Points - 1] = +obj.MidPayout.replace("$", "");
    majorPayout[+obj.Points - 1] = +obj.MajorPayout.replace("$", "");
    playoffPayout[+obj.Points - 1] = +obj.PlayoffPayout.replace("$", "");
    bottomPoints[+obj.Points - 1] = +obj.BottomPoints.replace("$", "");
    midPoints[+obj.Points - 1] = +obj.MidPoints.replace("$", "");
    majorPoints[+obj.Points - 1] = +obj.MajorPoints.replace("$", "");
    playoffStart[+obj.Points - 1] = +obj.PlayoffStart.replace("$", "");
  });

  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: bottomPayout,
      points: bottomPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: midPayout,
      points: midPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: majorPayout,
      points: majorPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: playoffPayout,
      points: playoffStart,
    },
  });
};

const seed2021Data = async (season: Season | undefined) => {
  if (!season) return;
  const output: {
    Payout: string;
    BottomPayout: string;
    MidPayout: string;
    MajorPayout: string;
    PlayoffPayout: string;
    Points: string;
    BottomPoints: string;
    MidPoints: string;
    MajorPoints: string;
    PlayoffStart: string;
  }[] = await fetch(
    "https://opensheet.elk.sh/1LUjmZDiECBoAfBC7UM0iwKJy8Im2TRn0mjqm4wBfMyM/Distributions",
  ).then((res) => res.json());
  const bottomPayout: number[] = Array(75).fill(0),
    midPayout: number[] = Array(75).fill(0),
    majorPayout: number[] = Array(75).fill(0),
    playoffPayout: number[] = Array(75).fill(0),
    bottomPoints: number[] = Array(75).fill(0),
    midPoints: number[] = Array(75).fill(0),
    majorPoints: number[] = Array(75).fill(0),
    playoffStart: number[] = Array(75).fill(0);

  output.forEach((obj) => {
    bottomPayout[+obj.Points - 1] = +obj.BottomPayout.replace("$", "");
    midPayout[+obj.Points - 1] = +obj.MidPayout.replace("$", "");
    majorPayout[+obj.Points - 1] = +obj.MajorPayout.replace("$", "");
    playoffPayout[+obj.Points - 1] = +obj.PlayoffPayout.replace("$", "");
    bottomPoints[+obj.Points - 1] = +obj.BottomPoints.replace("$", "");
    midPoints[+obj.Points - 1] = +obj.MidPoints.replace("$", "");
    majorPoints[+obj.Points - 1] = +obj.MajorPoints.replace("$", "");
    playoffStart[+obj.Points - 1] = +obj.PlayoffStart.replace("$", "");
  });

  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: bottomPayout,
      points: bottomPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: midPayout,
      points: midPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: majorPayout,
      points: majorPoints,
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: playoffPayout,
      points: playoffStart,
    },
  });
};
