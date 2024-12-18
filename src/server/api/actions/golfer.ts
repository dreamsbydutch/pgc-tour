"use server";

import {
  DatagolfEventInput,
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@/types/datagolf_types";

export async function chooseGolfers() {
  const fieldData = await fetch(
    "https://feeds.datagolf.com/field-updates?file_format=json&tour=pga&key=d3bc85650eb3306f6d6e2c0c4bd5",
  );
  const rankingData = await fetch(
    "https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=d3bc85650eb3306f6d6e2c0c4bd5",
  );
  const rawData = await fetch(
    "https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=d3bc85650eb3306f6d6e2c0c4bd5",
  );
  const fieldOutput: DatagolfFieldInput = await fieldData.json();
  const rankingOutput: DatagolfRankingInput = await rankingData.json();
  const rawOutput: DatagolfEventInput[] = await rawData.json();
  const field = fieldOutput.field.map((obj) => {
    return {
      ...obj,
      rank: rankingOutput.rankings.filter((a) => a.dg_id === obj.dg_id)[0],
    };
  });
  console.log(
    rawOutput.filter((obj) => obj.calendar_year === 2024 && obj.tour === "pga"),
  );
}
