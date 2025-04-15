"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import type {
  DataGolfLiveTournament,
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfLiveGolfer,
  DatagolfRankingInput,
} from "@/src/types/datagolf_types";
import type { TeamData, TournamentData } from "@/src/types/prisma_include";
import type { Golfer } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL.
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  // Fetch external golf data.
  const liveData = (await fetchDataGolf(
    "preds/in-play",
    null,
  )) as DataGolfLiveTournament;
  const fieldData = (await fetchDataGolf(
    "field-updates",
    null,
  )) as DatagolfFieldInput;
  const rankingsData = (await fetchDataGolf(
    "preds/get-dg-rankings",
    null,
  )) as DatagolfRankingInput;

  // Get the current tournament; if none, redirect.
  const tournament = (await api.tournament.getInfo()).current
  if (!tournament) return NextResponse.redirect(`${origin}/`);

  // Retrieve golfers and teams associated with the tournament.
  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });
  const teams = await api.team.getByTournament({ tournamentId: tournament.id });
  const golferIDs = teams.map((team) => team.golferIds).flat();

  let liveGolfersCount = 0;

  // Create new golfer entries for golfers in the field that are not in our database.
  await createMissingGolfers(
    fieldData.field,
    golfers,
    rankingsData,
    tournament,
  );

  // Update each existing golfer with live and field data.
  await updateExistingGolfers(
    golfers,
    liveData,
    fieldData,
    tournament,
    golferIDs,
    teams,
    (count) => {
      liveGolfersCount += count;
    },
  );

  // Update the tournament status.
  await api.tournament.update({
    id: tournament.id,
    currentRound:
      golfers.filter((obj) => !obj.roundOne).length > 0
        ? 1
        : golfers.filter((obj) => !obj.roundTwo).length > 0
          ? 2
          : golfers.filter(
                (obj) =>
                  !obj.roundThree &&
                  obj.position !== "CUT" &&
                  obj.position !== "WD" &&
                  obj.position !== "DQ",
              ).length > 0
            ? 3
            : golfers.filter(
                  (obj) =>
                    !obj.roundFour &&
                    obj.position !== "CUT" &&
                    obj.position !== "WD" &&
                    obj.position !== "DQ",
                ).length > 0
              ? 4
              : 5,
    livePlay: liveGolfersCount > 0,
  });

  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * Creates golfer records for any golfers in the field data that are missing
 * from the current list of golfers.
 */
async function createMissingGolfers(
  field: DatagolfFieldGolfer[],
  existingGolfers: Array<{ apiId: number }>,
  rankingsData: DatagolfRankingInput,
  tournament: TournamentData,
) {
  const existingApiIds = existingGolfers.map((g) => g.apiId);
  const missingGolfers = field.filter(
    (golfer) => !existingApiIds.includes(golfer.dg_id),
  );

  await Promise.all(
    missingGolfers.map(async (golfer) => {
      // Attach ranking data to the golfer.
      golfer.ranking_data = rankingsData.rankings.find(
        (r) => r.dg_id === golfer.dg_id,
      );
      const [lastName, firstName] = golfer.player_name.split(", ");
      const golferData = {
        apiId: golfer.dg_id,
        playerName: `${firstName} ${lastName}`,
        group: 0,
        worldRank: golfer.ranking_data?.owgr_rank ?? 501,
        rating:
          Math.round(
            ((golfer.ranking_data?.dg_skill_estimate ?? -1.875) + 2) / 0.0004,
          ) / 100,
        tournamentId: tournament.id,
      };
      await api.golfer.create(golferData);
    }),
  );
}

/**
 * Updates existing golfers with live and field data.
 * The `addLiveCount` callback accumulates the number of golfers with live data.
 */
async function updateExistingGolfers(
  golfers: Golfer[],
  liveData: DataGolfLiveTournament,
  fieldData: DatagolfFieldInput,
  tournament: TournamentData,
  golferIDs: number[],
  teams: TeamData[],
  addLiveCount: (count: number) => void,
) {
  await Promise.all(
    golfers.map(async (golfer) => {
      // Initialize update object.
      const updateData: { id: number } & Partial<Omit<Golfer, "id">> = {
        id: golfer.id,
      };

      // Find matching live and field data records.
      const liveGolfer = liveData.data.find(
        (obj) =>
          fieldData.event_name === liveData.info.event_name &&
          obj.dg_id === +golfer.apiId,
      );
      const fieldGolfer = fieldData.field.find(
        (obj) => obj.dg_id === +golfer.apiId,
      );

      // Calculate usage on the first round when not live.
      if (tournament.currentRound === 1 && tournament.livePlay) {
        updateData.usage =
          golferIDs.filter((id) => id === golfer.apiId).length / teams.length;
      }

      // Set tee times and round scores.
      setRoundTeeTimesAndScores(
        updateData,
        liveGolfer,
        fieldGolfer,
        fieldData,
        tournament,
      );

      // Update additional fields.
      if (liveGolfer?.top_10 !== undefined) {
        updateData.topTen = liveGolfer.top_10;
      }
      if (liveGolfer?.make_cut !== undefined) {
        updateData.makeCut = liveGolfer.make_cut;
      }
      if (liveGolfer?.win !== undefined) {
        updateData.win = liveGolfer.win;
      }
      if (liveGolfer?.current_pos !== undefined) {
        updateData.position = liveGolfer.current_pos;
        const posCurrent = Number(liveGolfer.current_pos.replace("T", ""));
        const posOld = Number(golfer.position?.replace("T", "") ?? 0);
        const posChange = posCurrent - posOld;
        updateData.posChange = isNaN(posChange) ? undefined : posChange;
      }
      if (
        liveGolfer?.current_score !== undefined &&
        liveGolfer.current_pos !== undefined &&
        liveGolfer.current_pos !== "--" &&
        liveGolfer.current_pos !== "WD" &&
        liveGolfer.current_pos !== "DQ"
      ) {
        updateData.score = liveGolfer.current_score;
      } else {
        updateData.score = undefined;
      }
      if (
        liveGolfer?.thru !== undefined &&
        liveGolfer.current_pos !== "WD" &&
        liveGolfer.current_pos !== "DQ" &&
        liveGolfer.current_pos !== "CUT"
      ) {
        updateData.thru = liveGolfer.thru;
        if (liveGolfer.thru > 0 && liveGolfer.thru < 18) {
          addLiveCount(1);
        }
      }
      if (
        liveGolfer?.today !== undefined &&
        liveGolfer.current_pos !== "WD" &&
        liveGolfer.current_pos !== "DQ" &&
        liveGolfer.current_pos !== "CUT"
      ) {
        updateData.today = liveGolfer.today;
      } else if (
        (liveGolfer?.current_pos === "CUT" ||
          liveGolfer?.current_pos === "WD" ||
          liveGolfer?.current_pos === "DQ") &&
        (tournament.currentRound ?? 0) >= 3
      ) {
        updateData.today = null;
        updateData.thru = null;
      } else if (
        liveGolfer?.current_pos === "WD" ||
        liveGolfer?.current_pos === "DQ"
      ) {
        updateData.today = 8;
        updateData.thru = 18;
      }
      if (
        liveGolfer?.country !== undefined &&
        golfer.country === null &&
        liveGolfer.country !== null
      ) {
        updateData.country = liveGolfer.country ?? undefined;
      }
      if (liveGolfer?.end_hole !== undefined) {
        updateData.endHole = liveGolfer.end_hole;
      }
      if (fieldGolfer?.start_hole !== undefined) {
        updateData.endHole =
          fieldGolfer.start_hole === 1
            ? 18
            : fieldGolfer.start_hole === 10
              ? 9
              : undefined;
      }

      await api.golfer.update(updateData);
      return updateData;
    }),
  );
}

/**
 * Sets tee times and round scores for a golfer.
 */
function setRoundTeeTimesAndScores(
  updateData: Partial<Golfer>,
  liveGolfer: DatagolfLiveGolfer | undefined,
  fieldGolfer: DatagolfFieldGolfer | undefined,
  fieldData: DatagolfFieldInput,
  tournament: TournamentData,
) {
  // Round One
  if (fieldGolfer?.r1_teetime) {
    updateData.roundOneTeeTime = fieldGolfer.r1_teetime;
    updateData.round = 1;
  }
  if (liveGolfer?.R1) {
    updateData.roundOne = liveGolfer.R1;
    updateData.round = 2;
  }
  if (
    !liveGolfer?.R1 &&
    fieldGolfer?.r1_teetime &&
    (fieldData.current_round > 1 ||
      liveGolfer?.current_pos == "WD" ||
      liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundOne = tournament.course.par + 8;
  }

  // Round Two
  if (fieldGolfer?.r2_teetime) {
    updateData.roundTwoTeeTime = fieldGolfer.r2_teetime;
  }
  if (liveGolfer?.R2) {
    updateData.roundTwo = liveGolfer.R2;
    if (
      liveGolfer?.current_pos == "CUT" ||
      liveGolfer?.current_pos == "WD" ||
      liveGolfer?.current_pos === "DQ"
    ) {
      updateData.round = 2;
    } else {
      updateData.round = 3;
    }
  }
  if (
    !liveGolfer?.R2 &&
    fieldGolfer?.r1_teetime &&
    (fieldData.current_round > 2 ||
      liveGolfer?.current_pos == "WD" ||
      liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundTwo = tournament.course.par + 8;
  }

  // Round Three
  if (fieldGolfer?.r3_teetime) {
    updateData.roundThreeTeeTime = fieldGolfer.r3_teetime;
  }
  if (liveGolfer?.R3) {
    updateData.roundThree = liveGolfer.R3;
    updateData.round = 4;
  }
  if (
    !liveGolfer?.R3 &&
    fieldGolfer?.r3_teetime &&
    (fieldData.current_round > 3 ||
      liveGolfer?.current_pos == "WD" ||
      liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundThree = tournament.course.par + 8;
  }

  // Round Four
  if (fieldGolfer?.r4_teetime) {
    updateData.roundFourTeeTime = fieldGolfer.r4_teetime;
  }
  if (liveGolfer?.R4) {
    updateData.roundFour = liveGolfer.R4;
    updateData.round = 5;
  }
  if (
    !liveGolfer?.R4 &&
    fieldGolfer?.r4_teetime &&
    (fieldData.current_round > 4 ||
      liveGolfer?.current_pos == "WD" ||
      liveGolfer?.current_pos === "DQ")
  ) {
    updateData.roundFour = tournament.course.par + 8;
  }
}

// https://www.pgctour.ca/cron/update-golfers
// http://localhost:3000/cron/update-golfers
