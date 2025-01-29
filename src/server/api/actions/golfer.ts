"use server";

import type {
  DatagolfEventInput,
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@/types/datagolf_types";

export async function chooseGolfers() {
  const fieldOutput:DatagolfFieldInput = await fetch(
    "https://feeds.datagolf.com/field-updates?file_format=json&tour=pga&key=d3bc85650eb3306f6d6e2c0c4bd5",
  ).then(res => res.json() as unknown as DatagolfFieldInput)
  const rankingOutput: DatagolfRankingInput = await fetch(
    "https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=d3bc85650eb3306f6d6e2c0c4bd5",
  ).then(res => res.json() as unknown as DatagolfRankingInput)
  const rawOutput: DatagolfEventInput[] = await fetch(
    "https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=d3bc85650eb3306f6d6e2c0c4bd5",
  ).then(res => res.json() as unknown as DatagolfEventInput[])
  const field = fieldOutput.field.map((obj) => {
    return {
      ...obj,
      rank: rankingOutput.rankings.find((a) => a.dg_id === obj.dg_id),
    };
  });
}
