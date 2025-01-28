"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import {
  DataGolfLiveTournament,
  DatagolfFieldInput,
} from "@/src/types/datagolf_types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const next = searchParams.get("next") ?? "/";

  //es-lint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const liveData: DataGolfLiveTournament = await fetchDataGolf(
    "preds/in-play",
    null,
  );
  //es-lint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const fieldData: DatagolfFieldInput = await fetchDataGolf(
    "field-updates",
    null,
  );

  const tournament = await api.tournament.getCurrent();
  if (!tournament) return NextResponse.redirect(`${origin}/`);

  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });
  const teams = await api.team.getByTournament({ tournamentId: tournament.id });

  golfers.forEach(async (golfer) => {
    const data: {
      id: number;
      country?: string | undefined;
      earnings?: number | undefined;
      makeCut?: number | undefined;
      position?: string | undefined;
      win?: number | undefined;
      usage?: number | undefined;
      round?: number | undefined;
      score?: number | undefined;
      topTen?: number | undefined;
      today?: number | undefined;
      thru?: number | undefined;
      roundOneTeeTime?: string | undefined;
      roundOne?: number | undefined;
      roundTwoTeeTime?: string | undefined;
      roundTwo?: number | undefined;
      roundThreeTeeTime?: string | undefined;
      roundThree?: number | undefined;
      roundFourTeeTime?: string | undefined;
      roundFour?: number | undefined;
    } = { id: golfer.id, roundFour: undefined };
    const liveGolfer = liveData.data.find((obj) => obj.dg_id === golfer.apiId);
    const fieldGolfer = fieldData.field.find(
      (obj) => obj.dg_id === golfer.apiId,
    );
    if (!golfer.usage) {
      const usage =
        teams
          .map((obj) => obj.golferIds)
          .flat()
          .filter((obj) => obj === golfer.apiId).length / teams.length;
      data.usage = usage;
    }
    if (!golfer.roundOneTeeTime && fieldGolfer?.r1_teetime) {
      data.roundOneTeeTime = fieldGolfer.r1_teetime;
    }
    if (!golfer.roundOne && liveGolfer?.R1) {
      data.roundOne = liveGolfer.R1;
    }
    if (!golfer.roundOne && !liveGolfer?.R1 && fieldGolfer?.r1_teetime) {
      data.roundOne = tournament.course.par + 8;
    }
    if (!golfer.roundTwoTeeTime && fieldGolfer?.r2_teetime) {
      data.roundTwoTeeTime = fieldGolfer.r1_teetime;
    }
    if (!golfer.roundTwo && liveGolfer?.R2) {
      data.roundTwo = liveGolfer.R2;
    }
    if (!golfer.roundTwo && !liveGolfer?.R2 && fieldGolfer?.r1_teetime) {
      data.roundTwo = tournament.course.par + 8;
    }
    if (!golfer.roundThreeTeeTime && fieldGolfer?.r3_teetime) {
      data.roundThreeTeeTime = fieldGolfer.r3_teetime;
    }
    if (!golfer.roundThree && liveGolfer?.R3) {
      data.roundThree = liveGolfer.R3;
    }
    if (
      !golfer.roundThree &&
      !liveGolfer?.R3 &&
      fieldGolfer?.r3_teetime &&
      (liveGolfer?.round ?? 0) >= 3
    ) {
      data.roundThree = tournament.course.par + 8;
    }
    if (!golfer.roundFourTeeTime && fieldGolfer?.r4_teetime) {
      data.roundFourTeeTime = fieldGolfer.r4_teetime;
    }
    if (!golfer.roundFour && liveGolfer?.R4) {
      data.roundFour = liveGolfer.R4;
    }
    if (
      !golfer.roundFour &&
      !liveGolfer?.R4 &&
      fieldGolfer?.r4_teetime &&
      (liveGolfer?.round ?? 0) >= 4
    ) {
      data.roundFour = tournament.course.par + 8;
    }
    if (liveGolfer?.top_10 !== undefined) {
      data.topTen = liveGolfer.top_10;
    }
    if (liveGolfer?.make_cut !== undefined) {
      data.makeCut = liveGolfer.make_cut;
    }
    if (liveGolfer?.win !== undefined) {
      data.win = liveGolfer.win;
    }
    if (liveGolfer?.current_pos !== undefined) {
      data.position = liveGolfer.current_pos;
    }
    if (
      liveGolfer?.current_score !== undefined &&
      liveGolfer.current_pos !== "WD" &&
      liveGolfer.current_pos !== "DQ"
    ) {
      data.score = liveGolfer.current_score;
    }
    if (
      liveGolfer?.thru !== undefined &&
      liveGolfer.current_pos !== "WD" &&
      liveGolfer.current_pos !== "DQ" &&
      liveGolfer.current_pos !== "CUT"
    ) {
      data.thru = liveGolfer.thru;
    }
    if (
      liveGolfer?.today !== undefined &&
      liveGolfer.current_pos !== "WD" &&
      liveGolfer.current_pos !== "DQ" &&
      liveGolfer.current_pos !== "CUT"
    ) {
      data.today = liveGolfer.today;
    }
    if (liveGolfer?.round !== undefined) {
      data.round = liveGolfer.round;
    }
    if (liveGolfer?.country !== undefined && golfer.country === null) {
      data.country = liveGolfer.country;
    }

    await api.golfer.update(data);
  });

  return NextResponse.redirect(`${origin}${next}`);
}
// http://localhost:3000/cron/update-golfers
