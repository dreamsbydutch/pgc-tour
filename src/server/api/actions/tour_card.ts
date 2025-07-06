/**
 * Tour Card Server Actions
 * Server-side tour card management operations
 *
 * Handles tour card creation, deletion, and display name management.
 * Includes sophisticated name collision resolution for display names.
 */

"use server";

import { db } from "../../db";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { api } from "../../../trpc/server";
import type { Member, Tour, TourCard } from "@prisma/client";

/**
 * Create a new tour card for a user
 * Handles payment processing and tour card creation
 */
export async function createTourCard({
  tour,
  seasonId,
}: {
  tour: { id: string; buyIn: number };
  seasonId: string;
}) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    const user: Member | null = await api.member.getById({
      memberId: data.user.id,
    });

    if (!user || !data.user.email) {
      return { success: false, error: "User not found" };
    }

    // Create transaction for tour card fee
    await db.transactions.create({
      data: {
        amount: tour.buyIn,
        description: `Tour Card fee for ${user.firstname || ""} ${user.lastname || ""}`,
        seasonId: seasonId,
        transactionType: "TourCardFee",
        userId: user.id,
      },
    });

    // Update member account
    await db.member.update({
      where: { id: user.id },
      data: {
        account: user.account + tour.buyIn,
      },
    });

    // Create tour card
    const tourCard = await db.tourCard.create({
      data: {
        displayName:
          (user.firstname && user.firstname[0]) + ". " + user.lastname,
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
  } catch (error) {
    console.error("Error creating tour card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a tour card and process refund
 * Handles tour card deletion and account refunding
 */
export async function deleteTourCard({ tourCard }: { tourCard: TourCard }) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    const user = await api.member.getById({
      memberId: data.user.id,
    });

    const tour = await api.tour.getById({ tourID: tourCard.tourId });

    if (!user || !data.user.email || !tour) {
      return { success: false, error: "Required data not found" };
    }

    // Find and delete the transaction
    const transaction = await db.transactions.findFirst({
      where: {
        seasonId: tourCard.seasonId,
        transactionType: "TourCardFee",
        userId: user.id,
      },
    });

    if (transaction) {
      await db.transactions.delete({ where: { id: transaction.id } });
      await db.member.update({
        where: { id: user.id },
        data: { account: user.account - (tour.buyIn || 0) },
      });
    }

    await db.tourCard.delete({
      where: { id: tourCard.id },
    });

    redirect("/");
  } catch (error) {
    console.error("Error deleting tour card:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update tour card display names to resolve conflicts
 * Implements sophisticated name collision resolution by incrementally
 * expanding first names until unique display names are achieved
 */
export async function updateTourCardNames({
  tour,
  tourCard,
}: {
  tour: { id: string };
  tourCard: TourCard;
}) {
  const tourCards = await api.tourCard.getByTourId({ tourId: tour.id });
  const otherMatches = tourCards?.filter(
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
