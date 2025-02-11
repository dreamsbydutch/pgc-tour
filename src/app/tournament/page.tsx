"use server";

import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";

export default async function page() {
  const currentTourney = await api.tournament.getCurrent();
  if (currentTourney) {
    return redirect(`/tournament/${currentTourney.id}`);
  }
  const nextTourney = await api.tournament.getNext();
  if (nextTourney) {
    return redirect(`/tournament/${nextTourney.id}`);
  }
  const recentTourney = await api.tournament.getRecent();
  if (recentTourney) {
    return redirect(`/tournament/${recentTourney.id}`);
  }
  return redirect(`/`);
}
