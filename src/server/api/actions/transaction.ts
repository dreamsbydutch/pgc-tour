/**
 * Transaction Server Actions
 * Server-side financial transaction processing
 *
 * Handles payment processing, account management, and transaction history.
 */

"use server";

import { db } from "@/server/db";
import { api } from "@/trpc/server";
import type { Transactions } from "@prisma/client";

/**
 * Process a payment transaction
 * Handles payment processing and account deduction
 */
export async function processPayment(transaction: Transactions) {
  try {
    if (transaction.transactionType !== "Payment") {
      return { success: false, error: "Invalid transaction type" };
    }

    const member = await api.member.getById({ memberId: transaction.userId });
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check if member has sufficient funds
    if (member.account < transaction.amount) {
      return { success: false, error: "Insufficient funds" };
    }

    // Process the payment
    await api.member.update({
      id: member.id,
      account: member.account - transaction.amount,
    });

    // Create transaction record
    const newTransaction = await api.transaction.create({
      amount: transaction.amount,
      description: transaction.description,
      seasonId: transaction.seasonId,
      transactionType: "Payment",
      userId: transaction.userId,
    });

    return {
      success: true,
      transaction: newTransaction,
      newBalance: member.account - transaction.amount,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add funds to a member's account
 * Handles account credits and deposits
 */
export async function addFunds({
  memberId,
  amount,
  description,
  seasonId,
}: {
  memberId: string;
  amount: number;
  description: string;
  seasonId: string;
}) {
  try {
    const member = await api.member.getById({ memberId });
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Update member balance
    await api.member.update({
      id: member.id,
      account: member.account + amount,
    });

    // Create transaction record
    const transaction = await api.transaction.create({
      amount,
      description,
      seasonId,
      transactionType: "Payment",
      userId: memberId,
    });

    return {
      success: true,
      transaction,
      newBalance: member.account + amount,
    };
  } catch (error) {
    console.error("Error adding funds:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get transaction history for a member
 * Returns paginated transaction list with filtering
 */
export async function getTransactionHistory({
  memberId,
  seasonId,
  transactionType,
  limit = 50,
  offset = 0,
}: {
  memberId: string;
  seasonId?: string;
  transactionType?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const whereClause: any = { userId: memberId };

    if (seasonId) {
      whereClause.seasonId = seasonId;
    }

    if (transactionType) {
      whereClause.transactionType = transactionType;
    }

    const [transactions, total] = await Promise.all([
      db.transactions.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.transactions.count({ where: whereClause }),
    ]);

    return {
      success: true,
      transactions,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Error getting transaction history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      transactions: [],
      total: 0,
      hasMore: false,
    };
  }
}

/**
 * Get account balance for a member
 * Returns current account balance with recent activity summary
 */
export async function getAccountBalance(memberId: string) {
  try {
    const member = await api.member.getById({ memberId });
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Get recent transactions for context
    const recentTransactions = await db.transactions.findMany({
      where: { userId: memberId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      success: true,
      balance: member.account,
      recentTransactions,
    };
  } catch (error) {
    console.error("Error getting account balance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
