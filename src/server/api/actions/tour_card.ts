"use server";

import { db } from "../../db";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { api } from "@/src/trpc/server";

export async function createTourCard({
  tourId,
  seasonId,
}: {
  tourId: string;
  seasonId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = await api.member.getById({ memberId: data.user?.id });
  if (!user || !data.user || !data.user.email) return;
  await db.tourCard.create({
    data: {
      displayName: (user.firstname && user.firstname[0]) + ". " + user.lastname,
      memberId: data.user.id,
      tourId: tourId,
      seasonId: seasonId,
      earnings: 0,
      points: 0,
      position: "T1",
    },
  });
  redirect("/");
}

export async function deleteTourCard({ tourCardId }: { tourCardId: string }) {
  await db.tourCard.delete({
    where: {
      id: tourCardId,
    },
  });
  redirect("/");
}
