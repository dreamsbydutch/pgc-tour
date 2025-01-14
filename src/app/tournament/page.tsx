"use server";

import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";

export default async function page() {
  const currentTourney = await api.tournament.getCurrent();

  if (!currentTourney) {
    return redirect("/");
  }
  return redirect(`/tournament/${currentTourney.id}`);
}
