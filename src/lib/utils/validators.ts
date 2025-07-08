import { z } from "zod";


// Zod schema for Member validation based on emptyMember shape
export const memberSchema = z.object({
  id: z.string().min(1, "Member ID is required"),
  email: z.string().email("Invalid email address"),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  account: z.number().optional(),
  role: z.string().optional(),
  friends: z.array(z.string()).optional(),
});
