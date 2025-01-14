"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import {
  DatagolfFieldInput,
  DatagolfRankingInput,
} from "@/src/types/datagolf_types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const next = searchParams.get("next") ?? "/";

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

  const season = await api.season.getByYear({
    year: new Date().getFullYear() + 1,
  });
  const tournament = await api.tournament.getBySeason({ seasonId: season?.id });
  const currentTourney = tournament.sort(
    (a, b) => +a.startDate - +b.startDate,
  )[1];
  const golfers = await api.golfer.getByTournament({
    tournamentId: currentTourney?.id ?? "",
  });
  if (
    !currentTourney ||
    currentTourney?.name === fieldData.event_name ||
    golfers.length > 0
  ) {
    console.log(currentTourney);
    console.log(fieldData.event_name);
    console.log(golfers.length);
    return NextResponse.redirect(`${origin}/`);
  }

  fieldData.field = fieldData.field
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
    );

  const groupSizes = [
    Math.round(fieldData.field.length * 0.1),
    Math.round(fieldData.field.length * 0.25),
    Math.round(fieldData.field.length * 0.425),
    Math.round(fieldData.field.length * 0.7),
    fieldData.field.length,
  ];

  const groups = [
    fieldData.field
      .slice(0, groupSizes[0])
      .sort(
        (a, b) =>
          (a.ranking_data?.owgr_rank ?? 9999) -
          (b.ranking_data?.owgr_rank ?? 9999),
      ),
    fieldData.field
      .slice(groupSizes[0], groupSizes[1])
      .sort(
        (a, b) =>
          (a.ranking_data?.owgr_rank ?? 9999) -
          (b.ranking_data?.owgr_rank ?? 9999),
      ),
    fieldData.field
      .slice(groupSizes[1], groupSizes[2])
      .sort(
        (a, b) =>
          (a.ranking_data?.owgr_rank ?? 9999) -
          (b.ranking_data?.owgr_rank ?? 9999),
      ),
    fieldData.field
      .slice(groupSizes[2], groupSizes[3])
      .sort(
        (a, b) =>
          (a.ranking_data?.owgr_rank ?? 9999) -
          (b.ranking_data?.owgr_rank ?? 9999),
      ),
    fieldData.field
      .slice(groupSizes[3], groupSizes[4])
      .sort(
        (a, b) =>
          (a.ranking_data?.owgr_rank ?? 9999) -
          (b.ranking_data?.owgr_rank ?? 9999),
      ),
  ];

  groups.map((group, i) => {
    group.map(async (golfer) => {
      const name = golfer.player_name.split(", ");
      if (currentTourney && currentTourney.id) {
        await api.golfer.create({
          apiId: golfer.dg_id.toString(),
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
    });
  });

  return NextResponse.redirect(`${origin}/`);
}
// http://localhost:3000/cron/create-groups
