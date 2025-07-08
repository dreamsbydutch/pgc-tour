"use server";

import { api } from "@/trpc/server";

/**
 * Update member information
 * Simple member update action for forms and basic updates
 */
export async function updateMemberAction(memberData: {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email?: string;
  role?: string;
  account?: number;
  friends?: string[];
}) {
  try {
    // Convert null values to undefined for tRPC compatibility
    const updateData = {
      id: memberData.id,
      firstname: memberData.firstname ?? undefined,
      lastname: memberData.lastname ?? undefined,
      email: memberData.email,
      role: memberData.role,
      account: memberData.account,
      friends: memberData.friends,
    };

    // Use tRPC API to update the member
    const updatedMember = await api.member.update(updateData);

    return {
      success: true,
      data: updatedMember,
      error: null,
    };
  } catch (error) {
    console.error("Failed to update member:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
