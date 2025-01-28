"use server";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const next = searchParams.get("next") ?? "/";

  return NextResponse.redirect(`${origin}${next}`);
}
// http://localhost:3000/cron/update-teams
