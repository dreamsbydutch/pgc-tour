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

  const current = await api.tournament.getCurrent();
  const next = await api.tournament.getNext();
  const recent = await api.tournament.getRecent();

  console.log("RECENT ----------------------------", recent);
  console.log("CURRENT ----------------------------", current);
  console.log("NEXT ----------------------------", next);
}
