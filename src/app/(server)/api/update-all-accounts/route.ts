import { NextResponse } from "next/server";
import { db } from "src/server/db";

export async function GET() {
  // Get all members
  const members = await db.member.findMany();
  let updated = 0;

  for (const member of members) {
    // Get all transactions for this member
    const transactions = await db.transactions.findMany({
      where: { userId: member.id },
    });
    // Adjust transaction amounts based on TransactionType
    const adjustedTotal = transactions.reduce((sum, tx) => {
      const positiveTypes = ["Payment", "TournamentWinnings"];
      const negativeTypes = [
        "CharityDonation",
        "LeagueDonation",
        "Withdrawal",
        "TourCardFee",
      ];
      if (positiveTypes.includes(tx.transactionType)) {
        return sum + Math.abs(tx.amount);
      } else if (negativeTypes.includes(tx.transactionType)) {
        return sum - Math.abs(tx.amount);
      } else {
        return sum + tx.amount;
      }
    }, 0);
    // Update member account
    await db.member.update({
      where: { id: member.id },
      data: { account: adjustedTotal },
    });
    updated++;
  }

  return NextResponse.json({ success: true, updated });
}
