"use server";

import { api } from "@/src/trpc/server";

const seasons = [
  { year: 2021, number: 1 },
  { year: 2022, number: 2 },
  { year: 2023, number: 3 },
  { year: 2024, number: 4 },
  { year: 2025, number: 5 },
];

export async function seedSeasons() {
  // eslint-disable-next-line no-misused-promises
  seasons.forEach(addSeasonToDB);
}

const addSeasonToDB = async (season: { year: number; number: number }) => {
  const existingSeason = await api.season.getByYear({ year: season.year });
  if (!existingSeason) {
    try {
      await api.season.create({
        year: season.year,
        number: season.number,
      });
    } catch {
      console.log(season);
    }
  }
  return
};
