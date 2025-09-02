"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "src/lib/components/functional/ui/card";
import { Button } from "src/lib/components/functional/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "src/lib/components/functional/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { Member, TourCard } from "@pgc-store";
import { LittleFucker } from "./LittleFucker";
import type { Team } from "@prisma/client";
import { api } from "@pgc-trpcClient";
// Use tRPC React client for mutations
// import { updateMemberAction } from "@pgc-serverActions";
// Use tRPC React mutation for member update
// import any additional UI components as needed

interface UserCollectFormProps {
  tourCard: TourCard | null;
  member: Member | null;
  champions:
    | (Team & {
        tournament: {
          name: string;
          startDate: Date;
          logoUrl: string | null;
          currentRound: number | null;
        };
      })[]
    | null
    | undefined;
}

export const UserCollectForm: React.FC<UserCollectFormProps> = (props) => {
  // Error state for negative values
  const [negativeError, setNegativeError] = useState<string | null>(null);
  // Query for member data to enable refetch
  const memberQuery = api.member.getById.useQuery(
    { memberId: props.member?.id ?? "" },
    { enabled: !!props.member?.id },
  );

  const updateMember = api.member.update.useMutation();
  const { tourCard, member, champions } = props;
  // tRPC React mutation hook for creating transactions
  const createTransaction = api.transaction.create.useMutation();
  const [eTransfer, setETransfer] = useState(0);
  const [pgcDonation, setPgcDonation] = useState(0);
  const [charityDonation, setCharityDonation] = useState(0);
  const [buyInChecked, setBuyInChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);

  React.useEffect(() => {
    if (!showEmailTooltip) return;
    function handleClick() {
      setShowEmailTooltip(false);
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [showEmailTooltip]);

  // Calculate remaining balance
  // Use member.account as the balance
  const balance = member?.account ?? 0;
  const buyInAmount = buyInChecked ? 100 : 0;
  const remaining =
    balance - eTransfer - pgcDonation - charityDonation - buyInAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent submission if any value is negative
    if (eTransfer < 0 || pgcDonation < 0 || charityDonation < 0) {
      setNegativeError("Amounts cannot be negative.");
      setSubmitting(false);
      return;
    } else {
      setNegativeError(null);
    }
    e.preventDefault();
    setSubmitting(true);
    if (!member || !tourCard) {
      setSubmitting(false);
      return;
    }
    const transactions = [];
    const seasonId = tourCard.seasonId;
    const userId = member.id;
    // E-Transfer
    if (eTransfer > 0) {
      transactions.push({
        userId,
        seasonId,
        description: `E-Transfer payout to ${member.email}`,
        amount: eTransfer,
        transactionType: "Withdrawal" as const,
        paid: false,
      });
    }
    // PGC Donation
    if (pgcDonation > 0) {
      transactions.push({
        userId,
        seasonId,
        description: `PGC Donation`,
        amount: pgcDonation,
        transactionType: "LeagueDonation" as const,
        paid: false,
      });
    }
    // Charity Donation
    if (charityDonation > 0) {
      transactions.push({
        userId,
        seasonId,
        description: `Charity Donation`,
        amount: charityDonation,
        transactionType: "CharityDonation" as const,
        paid: false,
      });
    }
    // Update member account for buy-in
    if (buyInChecked) {
      transactions.push({
        userId,
        seasonId: "cm4w910dl000adx98dfjv9sdf",
        description: `Tour Card Fee for 2026`,
        amount: 100,
        transactionType: "TourCardFee" as const,
        paid: false,
      });
    }
    // Create transactions using tRPC React mutation hook
    if (transactions.length > 0) {
      await Promise.all(
        transactions.map((tx) => createTransaction.mutateAsync(tx)),
      );
      // Optionally update member account balance
      const totalTransactionAmount = transactions.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      await updateMember.mutateAsync({
        id: member.id,
        account: member.account - totalTransactionAmount,
      });
    }
    setSubmitting(false);
    // Refetch member/account data to update balance
    await memberQuery.refetch();
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Collect Your Money</CardTitle>
        <div className="my-2 text-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xl font-bold">
              {tourCard?.displayName}
              <LittleFucker
                champions={champions?.filter(
                  (a) => a.tournament.startDate.getFullYear() === 2025,
                )}
              />
            </div>
            <div className="">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Email:</span>
                <TooltipProvider>
                  <Tooltip
                    open={showEmailTooltip}
                    onOpenChange={setShowEmailTooltip}
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-primary hover:text-primary/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmailTooltip(true);
                        }}
                      >
                        {member?.email}
                        <HelpCircle
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Help"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="center"
                      className="max-w-xs"
                    >
                      Click the User button on the navbar to change your email
                      address.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <div>
            <span className="font-semibold">Earnings:</span> $
            {balance.toFixed(2)}
          </div>
          <div
            className={`mt-2 text-lg font-bold ${remaining < 0 ? "text-red-600" : "text-primary"}`}
          >
            Remaining Balance: ${remaining.toFixed(2)}
          </div>
          {remaining < 0 && (
            <div className="mt-1 text-sm font-semibold text-red-600">
              You have exceeded your available balance.
            </div>
          )}
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="mx-4 mb-4 space-y-2">
        {negativeError && (
          <div className="mb-2 text-sm font-semibold text-red-600">
            {negativeError}
          </div>
        )}
        <div>
          <label htmlFor="eTransfer" className="mb-1 block text-sm font-medium">
            E-Transfer Amount
          </label>
          <div className="flex items-center">
            <span className="mr-2 text-lg font-semibold">$</span>
            <input
              id="eTransfer"
              type="number"
              min={0}
              step={0.01}
              value={eTransfer === 0 ? "" : eTransfer}
              onChange={(e) => setETransfer(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-primary"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="pgcDonation"
            className="mb-1 block text-sm font-medium"
          >
            PGC Donation (optional)
          </label>
          <div className="flex items-center">
            <span className="mr-2 text-lg font-semibold">$</span>
            <input
              id="pgcDonation"
              type="number"
              min={0}
              step={0.01}
              value={pgcDonation === 0 ? "" : pgcDonation}
              onChange={(e) => setPgcDonation(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-primary"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="charityDonation"
            className="mb-1 block text-sm font-medium"
          >
            Charity Donation (optional)
          </label>
          <div className="flex items-center">
            <span className="mr-2 text-lg font-semibold">$</span>
            <input
              id="charityDonation"
              type="number"
              min={0}
              step={0.01}
              value={charityDonation === 0 ? "" : charityDonation}
              onChange={(e) => setCharityDonation(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring focus:ring-primary"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="buyInToggle"
            className="mb-1 block text-sm font-medium"
          >
            2026 PGC Buy-in
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="buyInToggle"
              aria-pressed={buyInChecked}
              disabled={remaining < 100 && !buyInChecked}
              onClick={() => setBuyInChecked(!buyInChecked)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${buyInChecked ? "bg-primary" : "bg-gray-300"} ${remaining < 100 && !buyInChecked ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${buyInChecked ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="ml-2 text-sm font-medium">
              {buyInChecked
                ? "Spot confirmed! (-$100)"
                : "Confirm your spot for next year ($100)"}
            </span>
          </div>
        </div>
        <Button
          type="submit"
          variant="action"
          size="lg"
          disabled={
            submitting ||
            remaining < 0 ||
            eTransfer < 0 ||
            pgcDonation < 0 ||
            charityDonation < 0
          }
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Card>
  );
};
