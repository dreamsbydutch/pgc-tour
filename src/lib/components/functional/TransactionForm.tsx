"use client";

import { api } from "@pgc-trpcClient";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  FieldInfo,
} from "src/lib/components/functional/ui";
import type { TransactionType } from "@prisma/client";
import { formatMoney } from "@pgc-utils";

const paymentSchema = z.object({
  userId: z.string().min(1, "Please select a member"),
  amount: z.number().min(1, "Every transaction must have an amount"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// Utility to get display name for a member
function getMemberDisplayName(member?: {
  firstname?: string | null;
  lastname?: string | null;
}) {
  return `${member?.firstname ?? ""} ${member?.lastname ?? ""}`.trim();
}

// Utility to build transaction description
function buildDescription(
  amount: number,
  member?: { firstname?: string | null; lastname?: string | null },
) {
  return `${formatMoney(amount)} payment made by ${getMemberDisplayName(member)}`.trim();
}

type MinimalMember = {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  account: number;
};

interface PaymentFormProps {
  allMembers: MinimalMember[];
}

export function PaymentForm({ allMembers }: PaymentFormProps) {
  const router = useRouter();
  const utils = api.useUtils();

  // tRPC mutations
  const createTransaction = api.transaction.create.useMutation();
  const updateMember = api.member.update.useMutation();

  const form = useForm<PaymentFormValues>({
    defaultValues: { userId: "", amount: 0 },
    onSubmit: async ({ value }) => {
      try {
        const member = allMembers?.find((obj) => obj.id === value.userId);
        if (!member) {
          throw new Error("Member not found");
        }

        // Check if member has sufficient funds
        if (member.account < value.amount) {
          throw new Error("Insufficient funds");
        }

        const description = buildDescription(value.amount, member);

        // Update member's account balance
        await updateMember.mutateAsync({
          id: member.id,
          account: member.account - value.amount,
        });

        // Create transaction record
        await createTransaction.mutateAsync({
          userId: value.userId,
          seasonId: "cm4w910jz000gdx9k30u3ihpb",
          description,
          amount: value.amount,
          transactionType: "Payment" as TransactionType,
        });

        // Invalidate and refresh
        await utils.member.invalidate();
        await utils.transaction.invalidate();
        router.refresh();
      } catch (error) {
        console.error("Error processing payment:", error);
        // You might want to show an error message to the user here
      }
    },
    validators: {
      onChange: (props: { value: PaymentFormValues }) => {
        const result = paymentSchema.safeParse(props.value);
        return result.success
          ? undefined
          : result.error.errors.map((e) => e.message).join(", ");
      },
    },
  });

  if (!allMembers) return <div>Error</div>;
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <form.Field name="userId">
          {(field) => (
            <div className="flex flex-col">
              <div className="flex flex-row">
                <label
                  htmlFor={field.name}
                  style={{ display: "block", marginBottom: ".5rem" }}
                >
                  Select Member
                </label>
                <select
                  className="ml-2 h-[1.5rem] border-2 px-0.5"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                >
                  <option value="">-- Select a Member --</option>
                  {allMembers
                    .filter((obj) => obj.account > 0)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {getMemberDisplayName(member)}
                      </option>
                    ))}
                </select>
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="amount">
          {(field) => (
            <div className="flex flex-col">
              <div className="flex flex-row">
                <label htmlFor={field.name} className="my-auto">
                  Amount:
                </label>
                <input
                  className="ml-2 h-[1.5rem] border-2 px-0.5"
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={1}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="my-2 h-[1.5rem] w-2/5"
            >
              {isSubmitting ? "..." : "Submit"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <Table className="mx-auto w-3/4 text-center font-varela">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center text-xs font-bold">
              Email
            </TableHead>
            <TableHead className="text-center text-xs font-bold">
              Name
            </TableHead>
            <TableHead className="text-center text-xs font-bold">
              Owing
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allMembers
            .filter((obj) => obj.account > 0)
            .map((member) => (
              <TableRow key={member.id}>
                <TableCell className="text-sm">{member.email}</TableCell>
                <TableCell className="text-sm">
                  {getMemberDisplayName(member)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatMoney(member.account)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  );
}
