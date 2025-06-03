"use client";

import StandingsMainView from "./views/main/StandingsMainView";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return <StandingsMainView searchParams={searchParams} />;
}
