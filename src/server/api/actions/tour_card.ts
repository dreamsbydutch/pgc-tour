"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "../../db";
import { redirect } from "next/navigation";
import { api } from "@/src/trpc/react";

export async function createTourCard({
  tourId,
  seasonId,
}: {
  tourId: string;
  seasonId: string;
}) {
  const user = await currentUser();
  if (!user || !user.primaryEmailAddress) return;
  await db.tourCard.create({
    data: {
      displayName:
        (user?.firstName && user?.firstName[0]) + ". " + user?.lastName,
      fullName: user?.firstName + " " + user?.lastName,
      email: user.primaryEmailAddress.emailAddress,
      userId: user.id,
      tourId: tourId,
      seasonId: seasonId,
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
