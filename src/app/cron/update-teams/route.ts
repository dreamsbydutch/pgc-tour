"use server";

import { fetchDataGolf } from "@/src/lib/utils";
import { api } from "@/src/trpc/server";
import {
  DataGolfeLiveTournament,
  DatagolfFieldGolfer,
  DatagolfFieldInput,
  DatagolfRankingInput,
  DatagolfTournament,
} from "@/src/types/datagolf_types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const next = searchParams.get("next") ?? "/";

  const liveData: DataGolfeLiveTournament = await fetchDataGolf(
    "preds/in-play",
    null,
  );

  const tournament = await api.tournament.getCurrent();
  if (!tournament) return NextResponse.redirect(`${origin}/`);

  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament.id,
  });

  golfers.map(golfer => {
    const liveGolfer = liveData.data.find(obj => obj.dg_id === golfer.apiId)
  })

  liveData.data.map((golfer) => {
    console.log(golfer.player_name, " - ", golfer.current_pos);
  });
}
// http://localhost:3000/cron/update-teams
