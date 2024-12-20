"use server";

import { db } from "../../db";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { api } from "@/src/trpc/server";
import { TourData } from "@/src/types/prisma_include";
import { Member, TourCard } from "@prisma/client";

export async function createTourCard({
  tour,
  seasonId,
}: {
  tour: TourData;
  seasonId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user: Member | null = await api.member.getById({
    memberId: data.user?.id,
  });
  if (!user || !data.user || !data.user.email) return;
  await db.transactions.create({
    data: {
      amount: tour.buyIn,
      description: "Tour Card fee for " + user.fullname,
      seasonId: seasonId,
      transactionType: "TourCardFee",
      userId: user.id,
    },
  });
  await db.member.update({
    where: { id: user.id },
    data: { account: user.account + tour.buyIn },
  });
  await db.tourCard.create({
    data: {
      displayName: (user.firstname && user.firstname[0]) + ". " + user.lastname,
      memberId: data.user.id,
      tourId: tour.id,
      seasonId: seasonId,
      earnings: 0,
      points: 0,
      position: "T1",
    },
  });
  redirect("/");
}

export async function deleteTourCard({ tourCard }: { tourCard: TourCard }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = await api.member.getById({
    memberId: data.user?.id,
  });
  const tour = await api.tour.getById({ tourID: tourCard.tourId });
  if (!user || !data.user || !data.user.email || !tour) return;
  const transaction = await db.transactions.findFirst({
    where: {
      seasonId: tourCard.seasonId,
      transactionType: "TourCardFee",
      userId: user.id,
    },
  });
  if (transaction) {
    await db.transactions.delete({ where: { id: transaction?.id } });
    await db.member.update({
      where: { id: user.id },
      data: { account: user.account - tour.buyIn },
    });
  }
  await db.tourCard.delete({
    where: {
      id: tourCard.id,
    },
  });
  redirect("/");
}
