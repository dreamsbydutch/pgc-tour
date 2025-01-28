"use server";

import { api } from "@/src/trpc/server";
import type { Transactions } from "@prisma/client";

export async function processPayment(transaction: Transactions) {
  if (transaction.transactionType !== "Payment") return;
  const member = await api.member.getById({ memberId: transaction.userId });
  if (!member) return;
  await api.member.update({
    id: member.id,
    account: member.account - transaction.amount,
  });
  await api.transaction.create({
    amount: transaction.amount,
    description: transaction.description,
    seasonId: transaction.seasonId,
    transactionType: "Payment",
    userId: transaction.userId,
  });
}
