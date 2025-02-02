"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import type {
  DataGolfLiveTournament,
  DatagolfFieldInput,
} from "@/src/types/datagolf_types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const next = searchParams.get("next") ?? "/";

  const liveData = (await fetchDataGolf(
    "preds/in-play",
    null,
  )) as DataGolfLiveTournament;
  const fieldData = (await fetchDataGolf(
    "field-updates",
    null,
  )) as DatagolfFieldInput;

  const tournament = await api.tournament.getCurrent();
  if (!tournament) return NextResponse.redirect(`${origin}/`);

  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });
  const teams = await api.team.getByTournament({ tournamentId: tournament.id });

  let liveGolfers = 0;
  let liveRounds = new Set();

  await Promise.all(
    golfers.map(async (golfer) => {
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
        endHole?: number | undefined;
      } = { id: golfer.id, roundFour: undefined };
      const liveGolfer = liveData.data.find(
        (obj) =>
          fieldData.event_name === liveData.info.event_name &&
          obj.dg_id === golfer.apiId,
      );
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
      if (fieldGolfer?.r1_teetime) {
        data.roundOneTeeTime = fieldGolfer.r1_teetime;
      }
      if (liveGolfer?.R1) {
        data.roundOne = liveGolfer.R1;
      }
      if (
        !liveGolfer?.R1 &&
        fieldGolfer?.r1_teetime &&
        fieldData.current_round > 1
      ) {
        data.roundOne = tournament.course.par + 8;
      }
      if (fieldGolfer?.r2_teetime) {
        data.roundTwoTeeTime = fieldGolfer.r2_teetime;
      }
      if (liveGolfer?.R2) {
        data.roundTwo = liveGolfer.R2;
      }
      if (
        !liveGolfer?.R2 &&
        fieldGolfer?.r1_teetime &&
        fieldData.current_round > 2
      ) {
        data.roundTwo = tournament.course.par + 8;
      }
      if (fieldGolfer?.r3_teetime) {
        data.roundThreeTeeTime = fieldGolfer.r3_teetime;
      }
      if (liveGolfer?.R3) {
        data.roundThree = liveGolfer.R3;
      }
      if (
        !liveGolfer?.R3 &&
        fieldGolfer?.r3_teetime &&
        fieldData.current_round > 3
      ) {
        data.roundThree = tournament.course.par + 8;
      }
      if (fieldGolfer?.r4_teetime) {
        data.roundFourTeeTime = fieldGolfer.r4_teetime;
      }
      if (liveGolfer?.R4) {
        data.roundFour = liveGolfer.R4;
      }
      if (
        !liveGolfer?.R4 &&
        fieldGolfer?.r4_teetime &&
        fieldData.current_round > 4
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
        if (liveGolfer.thru > 0 && liveGolfer.thru < 18) {
          liveGolfers += 1;
        }
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
      if (liveGolfer?.end_hole !== undefined) {
        data.endHole = liveGolfer.end_hole;
      }
      if (
        liveGolfer &&
        liveGolfer.current_pos !== "WD" &&
        liveGolfer.current_pos !== "DQ" &&
        liveGolfer.current_pos !== "CUT"
      ) {
        liveRounds.add(liveGolfer?.round);
      }

      await api.golfer.update(data);

      return data;
    }),
  );

  await api.tournament.update({
    id: tournament.id,
    currentRound: [...liveRounds].sort(
      (a, b) => (a as number) - (b as number),
    )[0] as number,
    livePlay: liveGolfers > 0 ? true : false,
  });

  return NextResponse.redirect(`${origin}/cron/update-teams`);
}
// https://www.pgctour.ca/cron/update-golfers
// http://localhost:3000/cron/update-golfers
