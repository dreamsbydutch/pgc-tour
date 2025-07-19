"use client";

/**
 * Custom hook for managing friend relationships in StandingsView
 *
 * This hook provides functionality for adding and removing friends,
 * with optimistic updates and proper loading state management.
 * It handles the complex state management needed for friend operations
 * including tracking which friends are currently being updated.
 *
 * @param currentMember - The current user's member data
 * @returns Object containing friend management state and actions
 */

import { useState, useCallback } from "react";
import { api } from "@pgc-trpcClient";
import type { Member } from "@prisma/client";
import type { FriendManagementHook } from "../utils/types";

/**
 * Hook for managing friend relationships
 *
 * Provides optimistic updates, loading states, and error handling
 * for adding and removing friends in the standings view.
 */
export function useFriendManagement(
  currentMember?: Member | null,
): FriendManagementHook {
  const utils = api.useUtils();
  const [friendChangingIds, setFriendChangingIds] = useState<Set<string>>(
    new Set(),
  );

  const updateMemberMutation = api.member.update.useMutation({
    onSuccess: () => {
      void utils.member.invalidate();
    },
    onError: (error) => {
      console.error("Failed to update friend list:", error);
    },
  });

  const addToChangingSet = useCallback((memberId: string) => {
    setFriendChangingIds((prev) => new Set([...prev, memberId]));
  }, []);

  const removeFromChangingSet = useCallback((memberId: string) => {
    setFriendChangingIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
  }, []);

  const addFriend = useCallback(
    async (memberId: string) => {
      if (!currentMember || friendChangingIds.has(memberId)) return;

      addToChangingSet(memberId);

      try {
        const updatedFriends = [...(currentMember.friends ?? []), memberId];
        await updateMemberMutation.mutateAsync({
          id: currentMember.id,
          friends: updatedFriends,
        });
      } catch (error) {
        console.error("Failed to add friend:", error);
      } finally {
        removeFromChangingSet(memberId);
      }
    },
    [
      currentMember,
      friendChangingIds,
      addToChangingSet,
      removeFromChangingSet,
      updateMemberMutation,
    ],
  );

  const removeFriend = useCallback(
    async (memberId: string) => {
      if (!currentMember || friendChangingIds.has(memberId)) return;

      addToChangingSet(memberId);

      try {
        const updatedFriends = (currentMember.friends ?? []).filter(
          (id) => id !== memberId,
        );
        await updateMemberMutation.mutateAsync({
          id: currentMember.id,
          friends: updatedFriends,
        });
      } catch (error) {
        console.error("Failed to remove friend:", error);
      } finally {
        removeFromChangingSet(memberId);
      }
    },
    [
      currentMember,
      friendChangingIds,
      addToChangingSet,
      removeFromChangingSet,
      updateMemberMutation,
    ],
  );

  return {
    state: {
      friendChangingIds,
      isUpdating: updateMemberMutation.isPending,
    },
    actions: {
      addFriend,
      removeFriend,
    },
  };
}
