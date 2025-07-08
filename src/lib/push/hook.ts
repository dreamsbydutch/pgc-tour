/**
 * React Hook for Push Notifications
 *
 * Custom hook for managing push notification subscription state and actions
 */

import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  isPushNotificationSupported,
} from "./client";
import type { PushNotificationHookReturn } from "./types";

/**
 * Custom hook for managing push notification subscription state
 * @param memberId - The unique identifier for the member
 * @returns Object with subscription state and toggle handler
 */
export function usePushNotifications(
  memberId?: string,
): PushNotificationHookReturn {
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    const checkPushNotifications = async () => {
      if (isPushNotificationSupported()) {
        setPushSupported(true);
        try {
          const subscription = await getCurrentSubscription();
          setIsPushSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking push subscription:", error);
        }
      }
    };

    void checkPushNotifications();
  }, []);

  const handleToggle = async () => {
    if (!memberId) {
      alert("Member ID is required for push notifications.");
      return;
    }

    try {
      if (isPushSubscribed) {
        // Unsubscribe from push notifications
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsPushSubscribed(false);
        }
      } else {
        // Subscribe to push notifications
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          const subscription = await subscribeToPushNotifications(memberId);
          if (subscription) {
            setIsPushSubscribed(true);
          }
        } else {
          alert(
            "Push notifications permission denied. You can enable them in your browser settings.",
          );
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      alert("Failed to update push notification settings. Please try again.");
    }
  };

  return {
    isPushSubscribed,
    pushSupported,
    handleToggle,
  };
}
