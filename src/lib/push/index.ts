/**
 * Push Notification System for PGC Tour
 *
 * Centralized push notification management with client-side subscription handling,
 * React hooks, server utilities, and type definitions.
 *
 * @example Client-side usage:
 * ```typescript
 * import { usePushNotifications } from "@/src/lib/push";
 *
 * function MyComponent({ memberId }) {
 *   const { isPushSubscribed, handleToggle } = usePushNotifications(memberId);
 *   return <button onClick={handleToggle}>Toggle Notifications</button>;
 * }
 * ```
 *
 * @example Direct function usage:
 * ```typescript
 * import { subscribeToPushNotifications } from "@/src/lib/push";
 *
 * const subscription = await subscribeToPushNotifications(memberId);
 * ```
 */

// Re-export client functions
export {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  isPushNotificationSupported,
} from "./client";

// Re-export React hook
export { usePushNotifications } from "./hook";

// Re-export server utilities
export { TournamentNotifications, PushNotificationSender } from "./server";

// Re-export types
export type {
  PushSubscriptionData,
  PushNotificationResponse,
  PushNotificationHookReturn,
  TournamentNotificationType,
  TournamentNotification,
} from "./types";
