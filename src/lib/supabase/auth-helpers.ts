"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { db } from "../../server/db";
import { Member } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  avatar?: string;
}

export interface AuthData {
  user: AuthUser | null;
  member: Member | null;
}

/**
 * Get basic authenticated user data from middleware headers.
 */
export async function getUserFromHeaders(): Promise<AuthUser | null> {
  const headersList = headers();

  const userId = headersList.get("x-user-id");
  const userEmail = headersList.get("x-user-email");
  const userAvatar = headersList.get("x-user-avatar");

  if (!userId || !userEmail) return null;

  return {
    id: userId,
    email: userEmail,
    avatar: userAvatar || undefined,
  };
}
/**
 * Get full member data by looking up in database using user email from headers.
 * This function is cached to avoid repeated database calls.
 */
export const getMemberFromHeaders = cache(async (): Promise<Member | null> => {
  const user = await getUserFromHeaders();
  if (!user) return null;

  try {
    const member = await db.member.findUnique({
      where: { email: user.email },
    });

    return member;
  } catch (error) {
    console.error("Failed to fetch member:", error);
    return null;
  }
});

/**
 * Get authenticated user and member data.
 * Use this in server components instead of calling Supabase directly.
 */
export async function getAuthFromHeaders(): Promise<AuthData> {
  const [user, member] = await Promise.all([
    getUserFromHeaders(),
    getMemberFromHeaders(),
  ]);

  return { user, member };
}

/**
 * Get just the member ID from database lookup.
 */
export async function getMemberIdFromHeaders(): Promise<string | null> {
  const member = await getMemberFromHeaders();
  return member?.id || null;
}

/**
 * Get just the user ID from headers.
 */
export async function getUserIdFromHeaders(): Promise<string | null> {
  const headersList = headers();
  return headersList.get("x-user-id");
}

/**
 * Check if the current user is an admin.
 */
export async function isAdminFromHeaders(): Promise<boolean> {
  const headersList = headers();
  const userEmail = headersList.get("x-user-email");
  return userEmail === "chough14@gmail.com";
}

/**
 * Get member with specific relations - use for complex data needs.
 */
export const getMemberWithRelations = cache(async (include: any = {}) => {
  const user = await getUserFromHeaders();
  if (!user) return null;

  try {
    return await db.member.findUnique({
      where: { email: user.email },
      include,
    });
  } catch (error) {
    console.error("Failed to fetch member with relations:", error);
    return null;
  }
});
