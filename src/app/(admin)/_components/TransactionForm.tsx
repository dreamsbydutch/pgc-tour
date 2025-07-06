"use client";

import { paymentSchema } from "@/old-utils";
import { api } from "@/trpc/react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { FormEvent } from "react";
import { z } from "zod";
import { FieldInfo } from "../../../lib/components/ui/FieldInfo";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../lib/components/ui/table";
import { formatMoney } from "@/old-utils";
import { processPayment } from "@/server/api/actions/transaction";
import type { TransactionType } from "@prisma/client";
import { Button } from "../../../lib/components/ui/button";

const emptyTransaction = {
  id: 0,
  userId: "",
  seasonId: "cm4w910jz000gdx9k30u3ihpb",
  description: "",
  amount: 0,
  transactionType: "Payment" as TransactionType,
};

export default function PaymentForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const allMembers = api.member.getAll.useQuery().data;

  const form = useForm({
    defaultValues: emptyTransaction,
    onSubmit: async ({ value }) => {
      const member = allMembers?.find((obj) => obj.id === value.userId);
      value.description =
        formatMoney(value.amount) + " payment made by " + member?.fullname;
      await processPayment(value);
      await utils.member.invalidate();
      router.refresh();
      return;
    },
    validatorAdapter: zodValidator(),
    validators: { onChange: paymentSchema },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await form.handleSubmit();
    return;
  };

  if (!allMembers) return <div>Error</div>;
  return (
    <>
      <form onSubmit={(e) => handleSubmit(e)}>
        <form.Field name="userId">
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <label
                    htmlFor="member"
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
                  >
                    <option value="">-- Select a Member --</option>
                    {allMembers
                      .filter((obj) => obj.account > 0)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstname} {member.lastname}
                        </option>
                      ))}
                  </select>
                </div>
                <FieldInfo field={field} />
              </div>
            );
          }}
        </form.Field>
        <form.Field
          name="amount"
          validators={{
            onChange: z
              .number()
              .min(1, "Every transaction must have an amount"),
          }}
        >
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <label htmlFor={field.name} className="my-auto">
                    Amount:
                  </label>
                  <input
                    className="ml-2 h-[1.5rem] border-2 px-0.5"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(+e.target.value)}
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            );
          }}
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
                  {member.firstname + " " + member.lastname}
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
