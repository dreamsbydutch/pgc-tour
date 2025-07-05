/**
 * Push Notification Types for PGC Tour
 */

export interface PushSubscriptionData {
  subscription: PushSubscription;
  memberId: string;
}

export interface PushNotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PushNotificationHookReturn {
  /** Whether push notifications are currently subscribed */
  isPushSubscribed: boolean;
  /** Whether push notifications are supported by the browser */
  pushSupported: boolean;
  /** Function to toggle push notification subscription */
  handleToggle: () => Promise<void>;
}

/**
 * Tournament-specific notification types
 */
export type TournamentNotificationType =
  | "tournament_start"
  | "round_complete"
  | "leaderboard_update"
  | "final_results"
  | "standings_update";

export interface TournamentNotification {
  type: TournamentNotificationType;
  title: string;
  body: string;
  tournamentId?: string;
  url?: string;
  icon?: string;
}
