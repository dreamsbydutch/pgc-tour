
"use server";

import { api } from "@pgc-trpcServer";
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
 * Get all transactions for a user
 */
export async function getUserTransactions(userId: string) {
  try {
    const transactions = await api.transaction.getByUser({ userId });
    return transactions;
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }
}