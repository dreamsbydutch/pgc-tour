"use server";

import { db } from "../../db";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { api } from "@/src/trpc/server";
import type { TourData } from "@/src/types/prisma_include";
import type { Member, TourCard } from "@prisma/client";

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
  const discount = discountArry.find(
    (obj) =>
      obj.email === user.email ||
      obj.name === (user.firstname && user.firstname[0]) + ". " + user.lastname,
  );
  if (discount) {
    await db.transactions.create({
    data: {
      amount: discount?.discount ?? 0,
      description: "Season 4 earnings discount for " + user.fullname,
      seasonId: seasonId,
      transactionType: "Payment",
      userId: user.id,
    },
  });
}
  await db.transactions.create({
    data: {
      amount: tour.buyIn ?? 0,
      description: "Tour Card fee for " + user.fullname,
      seasonId: seasonId,
      transactionType: "TourCardFee",
      userId: user.id,
    },
  });
  await db.member.update({
    where: { id: user.id },
    data: {
      account: user.account + (tour.buyIn ?? 0) - (discount?.discount ?? 0),
    },
  });
  const tourCard = await db.tourCard.create({
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
  await updateTourCardNames({ tour, tourCard });
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
      data: { account: user.account - (tour.buyIn ?? 0) },
    });
  }
  await db.tourCard.delete({
    where: {
      id: tourCard.id,
    },
  });
  redirect("/");
}

export async function updateTourCardNames({
  tour,
  tourCard,
}: {
  tour: TourData;
  tourCard: TourCard;
}) {
  const otherMatches = tour.tourCards.filter(
    (obj) =>
      obj.id !== tourCard.id &&
      obj.displayName.startsWith(tourCard.displayName[0] ?? "") &&
      obj.displayName.split(". ")[1] === tourCard.displayName.split(". ")[1],
  );
  if (!otherMatches) return;
  const member = await db.member.findUnique({
    where: { id: tourCard.memberId },
  });
  const otherMembers = await Promise.all(
    otherMatches.map(async (obj) => {
      return await db.member.findUnique({
        where: { id: obj.memberId },
      });
    }),
  );
  let matchLevel = 0;

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  otherMembers.forEach(async (otherMember) => {
    if (
      member?.firstname?.slice(0, 1) !== otherMember?.firstname?.slice(0, 1)
    ) {
      matchLevel = 1;
    } else if (
      member?.firstname?.slice(0, 2) !== otherMember?.firstname?.slice(0, 2)
    ) {
      matchLevel = 2;
      const otherMatch = otherMatches.find(
        (obj) => obj.memberId === otherMember?.id,
      );
      await db.tourCard.update({
        where: { id: otherMatch?.id },
        data: {
          displayName:
            (otherMember?.firstname && otherMember?.firstname.slice(0, 2)) +
            ". " +
            otherMember?.lastname,
        },
      });
    } else if (
      member?.firstname?.slice(0, 3) !== otherMember?.firstname?.slice(0, 3)
    ) {
      matchLevel = 3;
      const otherMatch = otherMatches.find(
        (obj) => obj.memberId === otherMember?.id,
      );
      await db.tourCard.update({
        where: { id: otherMatch?.id },
        data: {
          displayName:
            (otherMember?.firstname && otherMember?.firstname.slice(0, 3)) +
            ". " +
            otherMember?.lastname,
        },
      });
    } else {
      matchLevel = 4;
      const otherMatch = otherMatches.find(
        (obj) => obj.memberId === otherMember?.id,
      );
      await db.tourCard.update({
        where: { id: otherMatch?.id },
        data: {
          displayName: otherMember?.firstname + " " + otherMember?.lastname,
        },
      });
    }
    return;
  });

  if (matchLevel === 0) {
    return;
  } else if (matchLevel === 1) {
    await db.tourCard.update({
      where: { id: tourCard.id },
      data: {
        displayName:
          (member?.firstname && member?.firstname[0]) + ". " + member?.lastname,
      },
    });
  } else if (matchLevel === 2) {
    await db.tourCard.update({
      where: { id: tourCard.id },
      data: {
        displayName:
          (member?.firstname && member?.firstname.slice(0, 2)) +
          ". " +
          member?.lastname,
      },
    });
  } else if (matchLevel === 3) {
    await db.tourCard.update({
      where: { id: tourCard.id },
      data: {
        displayName:
          (member?.firstname && member?.firstname.slice(0, 3)) +
          ". " +
          member?.lastname,
      },
    });
  } else {
    await db.tourCard.update({
      where: { id: tourCard.id },
      data: { displayName: member?.firstname + " " + member?.lastname },
    });
  }
  return;
}

const discountArry = [
  { email: "b.m.wilkinson4@gmail.com", name: "B. Wilkinson", discount: 100 },
  { email: "samjwolman@gmail.com", name: "S. Wolman", discount: 40 },
  {
    email: "robert.wolfer@taylormadegolf.com",
    name: "R. Wolfer",
    discount: 30,
  },
  { email: "mack.graham9@hotmail.com", name: "M. Graham", discount: 30 },
  { email: "mohamadelbinni@gmail.com", name: "M. Binni", discount: 25 },
  { email: "eric.m.hubert@gmail.com", name: "E. Hubert", discount: 20 },
];
