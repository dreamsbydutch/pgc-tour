/**
 * Member Server Actions
 * Server-side member management and business logic
 *
 * Handles member tier management, tour card relationships, and member analytics.
 */

"use server";

import { api } from "../../../trpc/server";
import { db } from "../../db";
import type { Member } from "@prisma/client";

/**
 * Update member tiers based on performance or criteria
 * Handles tier progression logic for members
 */
export async function updateMemberTiers(seasonId: string) {
  try {
    const members = await db.member.findMany();
    const tourCards = await db.tourCard.findMany({
      where: { seasonId },
      include: { member: true },
    });

    // Calculate tier updates based on earnings or other criteria
    const updates = members.map(async (member) => {
      const memberCards = tourCards.filter((tc) => tc.memberId === member.id);
      const totalEarnings = memberCards.reduce(
        (sum, tc) => sum + (tc.earnings || 0),
        0,
      );

      // Define tier thresholds (example logic)
      let newRole = "Bronze";
      if (totalEarnings >= 100000) newRole = "Gold";
      else if (totalEarnings >= 50000) newRole = "Silver";

      if (member.role !== newRole) {
        return db.member.update({
          where: { id: member.id },
          data: { role: newRole },
        });
      }
      return null;
    });

    await Promise.all(updates);

    return { success: true, updated: updates.length };
  } catch (error) {
    console.error("Error updating member tiers:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get member with their tour cards
 * Enhanced member data including tour card history
 */
export async function getMemberWithTourCards(memberId: string) {
  try {
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    const tourCards = await db.tourCard.findMany({
      where: { memberId },
      include: {
        tour: true,
      },
      orderBy: { earnings: "desc" },
    });

    return {
      success: true,
      member: {
        ...member,
        tourCards,
        totalEarnings: tourCards.reduce(
          (sum, tc) => sum + (tc.earnings || 0),
          0,
        ),
        totalPoints: tourCards.reduce((sum, tc) => sum + (tc.points || 0), 0),
        tourCount: tourCards.length,
      },
    };
  } catch (error) {
    console.error("Error getting member with tour cards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get members filtered by tier
 * Returns members in a specific tier or role
 */
export async function getMembersByTier(tier: string) {
  try {
    const members = await db.member.findMany({
      where: { role: tier },
      orderBy: { account: "desc" },
    });

    // Enhance with tour card summary
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const tourCards = await db.tourCard.findMany({
          where: { memberId: member.id },
        });

        return {
          ...member,
          tourCardCount: tourCards.length,
          totalEarnings: tourCards.reduce(
            (sum, tc) => sum + (tc.earnings || 0),
            0,
          ),
          totalPoints: tourCards.reduce((sum, tc) => sum + (tc.points || 0), 0),
        };
      }),
    );

    return { success: true, members: membersWithStats };
  } catch (error) {
    console.error("Error getting members by tier:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      members: [],
    };
  }
}

/**
 * Get comprehensive member statistics
 * Returns detailed analytics for a specific member
 */
export async function getMemberStats(memberId: string) {
  try {
    const member = await db.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    const [tourCards, transactions] = await Promise.all([
      db.tourCard.findMany({
        where: { memberId },
        include: { tour: true },
      }),
      db.transactions.findMany({
        where: { userId: memberId },
        orderBy: { id: "desc" },
        take: 10,
      }),
    ]);

    const stats = {
      totalEarnings: tourCards.reduce((sum, tc) => sum + (tc.earnings || 0), 0),
      totalPoints: tourCards.reduce((sum, tc) => sum + (tc.points || 0), 0),
      averageEarnings:
        tourCards.length > 0
          ? tourCards.reduce((sum, tc) => sum + (tc.earnings || 0), 0) /
            tourCards.length
          : 0,
      bestFinish: tourCards.reduce((best, tc) => {
        const pos = tc.position ? parseInt(tc.position.replace("T", "")) : 999;
        return pos < best ? pos : best;
      }, 999),
      tournamentsPlayed: tourCards.length,
      currentBalance: member.account,
      recentTransactions: transactions,
    };

    return {
      success: true,
      member: {
        ...member,
        stats,
        tourCards,
      },
    };
  } catch (error) {
    console.error("Error getting member stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
