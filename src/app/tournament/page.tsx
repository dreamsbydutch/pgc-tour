"use server";

import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";

export default async function page() {
  const tournaments = await api.tournament.getInfo();
  if (tournaments.current) {
    return redirect(`/tournament/${tournaments.current.id}`);
  }
  if (tournaments.next) {
    return redirect(`/tournament/${tournaments.next.id}`);
  }
  if (tournaments.past) {
    return redirect(`/tournament/${tournaments.past.id}`);
  }
  return redirect(`/`);
}
