"use server";

import { Season } from "@prisma/client";
import { db } from "../../db";

export async function seedTiers() {
  const seasons = await db.season.findMany({});
  await seed2021Data(seasons.filter((obj) => obj.year === 2021)[0]);
  await seed2022Data(seasons.filter((obj) => obj.year === 2022)[0]);
  await seed2023Data(seasons.filter((obj) => obj.year === 2023)[0]);
  await seed2024Data(seasons.filter((obj) => obj.year === 2024)[0]);
}

const convertToArray = (obj: any) => {
  let i = 1,
    output: number[] = [];
  console.log(obj);
  while (i <= 75) {
    const x = String(i);
    output.push(+obj[x]);
    i++;
  }
  return output;
};

const seed2024Data = async (season: Season | undefined) => {
  if (!season) return;
  const res = await fetch(
    "https://opensheet.elk.sh/1SSk7lg3Ym17lw8Hn-yZvT_erE9umRHPlrZJ8U4faBMY/Distributions",
  );
  const output = await res.json();

  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "BottomPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "BottomPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "MidPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "MidPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "MajorPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "MajorPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: [...convertToArray(
        output.filter((obj: any) => obj.key === "GoldPlayoff")[0],
      ),...convertToArray(
        output.filter((obj: any) => obj.key === "SilverPlayoff")[0],
      )],
      points: convertToArray(
        output.filter((obj: any) => obj.key === "PlayoffStart")[0],
      ),
    },
  });
};

const seed2023Data = async (season: Season | undefined) => {
  if (!season) return;
  const res = await fetch(
    "https://opensheet.elk.sh/1EhRq77hWT0w_chnNVYhOq5_W_FQ--mPbliDyv3YHWG4/Distributions",
  );
  const output = await res.json();

  await db.tier.create({
    data: {
      name: "Bottom",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "BottomPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "BottomPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Mid",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "MidPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "MidPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Major",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "MajorPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "MajorPoints")[0],
      ),
    },
  });
  await db.tier.create({
    data: {
      name: "Playoff",
      seasonId: season.id,
      payouts: convertToArray(
        output.filter((obj: any) => obj.key === "PlayoffPayout")[0],
      ),
      points: convertToArray(
        output.filter((obj: any) => obj.key === "PlayoffStart")[0],
      ),
    },
  });
};

const seed2022Data = async (season: Season | undefined) => {
  if (!season) return;
  const res = await fetch(
    "https://opensheet.elk.sh/1ce6c0R9YggvfOxoilnZqqXfcAPxVKyaN0mly5_FOouk/Distributions",
  );
  const output = await res.json();

  const bottomPayout: number[] = Array(75).fill(0),
    midPayout: number[] = Array(75).fill(0),
    majorPayout: number[] = Array(75).fill(0),
    playoffPayout: number[] = Array(75).fill(0),
    bottomPoints: number[] = Array(75).fill(0),
    midPoints: number[] = Array(75).fill(0),
    majorPoints: number[] = Array(75).fill(0),
    playoffStart: number[] = Array(75).fill(0);

  output.forEach((obj: any) => {
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
  const res = await fetch(
    "https://opensheet.elk.sh/1LUjmZDiECBoAfBC7UM0iwKJy8Im2TRn0mjqm4wBfMyM/Distributions",
  );
  const output = await res.json();

  const bottomPayout: number[] = Array(75).fill(0),
    midPayout: number[] = Array(75).fill(0),
    majorPayout: number[] = Array(75).fill(0),
    playoffPayout: number[] = Array(75).fill(0),
    bottomPoints: number[] = Array(75).fill(0),
    midPoints: number[] = Array(75).fill(0),
    majorPoints: number[] = Array(75).fill(0),
    playoffStart: number[] = Array(75).fill(0);

  output.forEach((obj: any) => {
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
