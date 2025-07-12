"use server";

import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@server/db";
import type { Member } from "@prisma/client";

// Types
export interface AuthUser {
  id: string;
  email: string;
  avatar?: string;
}

export interface AuthData {
  user: AuthUser | null;
  member: Member | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Constants
const ADMIN_EMAIL = "chough14@gmail.com";

/**
 * Get user data from middleware headers
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
    avatar: userAvatar ?? undefined,
  };
}

/**
 * Get member data from database (cached)
 */
export const getMemberFromHeaders = cache(async (): Promise<Member | null> => {
  const user = await getUserFromHeaders();
  if (!user) return null;

  try {
    return await db.member.findUnique({
      where: { id: user.id },
    });
  } catch (error) {
    console.error("Failed to fetch member:", error);
    return null;
  }
});

/**
 * Get complete auth data (user + member)
 */
export async function getAuthData(): Promise<AuthData> {
  const [user, member] = await Promise.all([
    getUserFromHeaders(),
    getMemberFromHeaders(),
  ]);

  return {
    user,
    member,
    isAuthenticated: !!user,
    isAdmin: user?.email === ADMIN_EMAIL,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUserFromHeaders();
  return !!user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUserFromHeaders();
  return user?.email === ADMIN_EMAIL;
}

/**
 * Get user ID from headers
 */
export async function getUserId(): Promise<string | null> {
  const user = await getUserFromHeaders();
  return user?.id ?? null;
}

/**
 * Get user email from headers
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await getUserFromHeaders();
  return user?.email ?? null;
}

/**
 * Get member with relations (cached)
 */
export const getMemberWithRelations = cache(
  async (include: Record<string, unknown> = {}) => {
    const user = await getUserFromHeaders();
    if (!user) return null;

    try {
      return await db.member.findUnique({
        where: { id: user.id },
        include,
      });
    } catch (error) {
      console.error("Failed to fetch member with relations:", error);
      return null;
    }
  },
);

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUserFromHeaders();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.email !== ADMIN_EMAIL) {
    throw new Error("Admin access required");
  }
  return user;
}
