import { z } from "zod";

export const memberSchema = z.object({
  firstname: z.string().min(3, "Last name must be at least 3 characters"),
  lastname: z.string().min(3, "Last name must be at least 3 characters"),
  email: z.string().min(3, "Last name must be at least 3 characters"),
});
