"use server";

import { type DatagolfTournament } from "@/types/datagolf_types";
import { api } from "@/trpcLocal/server";
import { object } from "zod";

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
  const fieldOutput = await fieldData.json();
  const rankingOutput = await rankingData.json();
  const rawOutput = await rawData.json();
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

export async function seedGolfers() {
  const rawData = await fetch(
    "https://opensheet.elk.sh/1I3sq1tm1Wn6uIDcp8_3Uede4Qlj_WFNWMh1KJLtlYr0/pgaLeaderboard",
  );
  const rawOutput = await rawData.json();
  const season = await api.season.getByYear({ year: 2024 });
  const tournaments = await api.tournament.getBySeason({
    seasonId: season?.id,
  });
  const courses = await api.course.getAll();
  console.log(courses);
  const x = rawOutput.map((obj) => {
    return {
      apiId: obj.dgID,
      position: obj.currentPos,
      playerName: obj.playerName,
      score: obj.currentScore,
      makeCut: obj.makeCut,
      topTen: obj.topTen,
      win: obj.win,
      round: obj.round,
      group: obj.group,
      usage: obj.usage,
      tournamentId: "",
    };
  });
}
