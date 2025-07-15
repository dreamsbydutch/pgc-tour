"use client";

import { useState, useCallback } from "react";
import { api } from "@pgc-trpcClient";
import type { Member } from "@prisma/client";

export interface FriendManagementHook {
  friendChangingIds: Set<string>;
  handleAddFriend: (memberId: string) => Promise<void>;
  handleRemoveFriend: (memberId: string) => Promise<void>;
  isUpdating: boolean;
}

export function useFriendManagement(
  currentMember?: Member | null,
): FriendManagementHook {
  const utils = api.useUtils();
  const [friendChangingIds, setFriendChangingIds] = useState<Set<string>>(
    new Set(),
  );

  // Helper to add member to changing set
  const addToChangingSet = useCallback((memberId: string) => {
    setFriendChangingIds((prev) => {
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });
  }, []);

  // Helper to remove member from changing set
  const removeFromChangingSet = useCallback((memberId: string) => {
    setFriendChangingIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
  }, []);

  // Friend management mutations
  const updateMemberMutation = api.member.update.useMutation({
    onSuccess: () => {
      void utils.member.invalidate();
    },
    onError: (error) => {
      console.error("Failed to update friend list:", error);
    },
  });

  // Friend management handlers
  const handleAddFriend = useCallback(
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
        // Always remove from changing set when done
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

  const handleRemoveFriend = useCallback(
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
        // Always remove from changing set when done
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
    friendChangingIds,
    handleAddFriend,
    handleRemoveFriend,
    isUpdating: updateMemberMutation.isPending,
  };
}
