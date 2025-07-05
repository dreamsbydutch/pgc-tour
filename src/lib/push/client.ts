/**
 * Client-side Push Notification Functions for PGC Tour
 *
 * Handles browser push notification subscription, permission requests,
 * and communication with the server API.
 */

import type { PushSubscriptionData } from "./types";

// VAPID public key - generate using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Requests notification permission from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Subscribes a member to push notifications
 * @param memberId - The unique identifier for the member
 * @returns Promise<PushSubscription | null> - The subscription object or null if failed
 */
export async function subscribeToPushNotifications(
  memberId: string,
): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error("VAPID public key not configured");
    return null;
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Create subscription with VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save subscription to database
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        memberId,
      } as PushSubscriptionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to save subscription: ${response.status} - ${errorText}`,
      );
    }

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return null;
  }
}

/**
 * Unsubscribes from push notifications
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Remove from database
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });

    return true;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return false;
  }
}

/**
 * Gets the current push notification subscription
 * @returns Promise<PushSubscription | null> - The current subscription or null
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Failed to get current subscription:", error);
    return null;
  }
}

/**
 * Checks if push notifications are supported by the browser
 * @returns boolean - true if supported, false otherwise
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Converts a VAPID key from base64url to Uint8Array format
 * @param base64String - The base64url encoded VAPID key
 * @returns Uint8Array - The key in the correct format for push subscriptions
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
