"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import type {
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@/src/types/datagolf_types";
import { NextResponse } from "next/server";
// import fs from "fs";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  // const next = searchParams.get("next") ?? "/";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rankingsData: DatagolfRankingInput = await fetchDataGolf(
    "preds/get-dg-rankings",
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const fieldData: DatagolfFieldInput = await fetchDataGolf(
    "field-updates",
    null,
  );

  const currentTourney = await api.tournament.getCurrent();
  const golfers = await api.golfer.getByTournament({
    tournamentId: currentTourney?.id ?? "",
  });
  if (
    !currentTourney ||
    // currentTourney?.name === fieldData.event_name ||
    golfers.length > 0
  ) {
    return NextResponse.redirect(`${origin}/`);
  }

  const groups: DatagolfFieldGolfer[][] = [[], [], [], [], []];

  fieldData.field = fieldData.field
    .filter((golfer) => golfer.dg_id !== 18417)
    .map((golfer) => {
      golfer.ranking_data = rankingsData.rankings.find(
        (obj) => obj.dg_id === golfer.dg_id,
      );
      return golfer;
    })
    .sort(
      (a, b) =>
        (b.ranking_data?.dg_skill_estimate ?? -50) -
        (a.ranking_data?.dg_skill_estimate ?? -50),
    )
    .map((golfer, i) => {
      const remainingGolfers = fieldData.field.length - i;
      if (
        groups[0] &&
        groups[0].length < fieldData.field.length * 0.1 &&
        groups[0].length < 10
      ) {
        groups[0].push(golfer);
      } else if (
        groups[1] &&
        groups[1].length < fieldData.field.length * 0.175 &&
        groups[1].length < 16
      ) {
        groups[1].push(golfer);
      } else if (
        groups[2] &&
        groups[2].length < fieldData.field.length * 0.225 &&
        groups[2].length < 22
      ) {
        groups[2].push(golfer);
      } else if (
        groups[3] &&
        groups[3].length < fieldData.field.length * 0.25 &&
        groups[3].length < 30
      ) {
        groups[3].push(golfer);
      } else {
        if (
          (groups[3] &&
            groups[4] &&
            remainingGolfers <= groups[3].length + groups[4].length * 0.5) ||
          remainingGolfers === 1
        ) {
          groups[4]?.push(golfer);
        } else {
          if (i % 2) {
            groups[3]?.push(golfer);
          } else {
            groups[4]?.push(golfer);
          }
        }
      }
      return golfer;
    });

  await Promise.all(
    groups.map(async (group, i) => {
      await Promise.all(
        group.map(async (golfer) => {
          const name = golfer.player_name.split(", ");
          if (currentTourney && currentTourney.id) {
            await api.golfer.create({
              apiId: golfer.dg_id,
              playerName: name[1] + " " + name[0],
              group: i + 1,
              worldRank: golfer.ranking_data?.owgr_rank,
              rating:
                Math.round(
                  ((golfer.ranking_data?.dg_skill_estimate ?? 0) + 2) / 0.0004,
                ) / 100,
              tournamentId: currentTourney.id,
            });
          }
        }),
      );
    }),
  );

  return NextResponse.redirect(`${origin}/cron/update-golfers`);
}
// http://localhost:3000/cron/create-groups
// https://www.pgctour.ca/cron/create-groups
