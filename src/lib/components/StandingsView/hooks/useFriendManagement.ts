"use client";

import { useState, useCallback } from "react";
import { api } from "@pgc-trpcClient";
import type { Member } from "@prisma/client";
import type { FriendManagementState } from "../types";

export interface UseFriendManagementResult {
  state: FriendManagementState;
  actions: {
    addFriend: (memberId: string) => Promise<void>;
    removeFriend: (memberId: string) => Promise<void>;
  };
}

/**
 * Hook for managing friend relationships
 * Handles optimistic updates and loading states
 */
export function useFriendManagement(
  currentMember?: Member | null,
): UseFriendManagementResult {
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
