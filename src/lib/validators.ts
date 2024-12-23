import { z } from "zod";

export const memberSchema = z.object({
  firstname: z.string().min(3, "Last name must be at least 3 characters"),
  lastname: z.string().min(3, "Last name must be at least 3 characters"),
  email: z.string().min(3, "Last name must be at least 3 characters"),
});

export const paymentSchema = z.object({
  userId: z.string(),
  seasonId: z.string(),
  description: z.string(),
  amount: z.number().min(1, 'Every transaction must have an amount'),
  transactionType: z.string(),
})
