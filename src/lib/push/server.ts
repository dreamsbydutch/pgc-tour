/**
 * Server-side Push Notification Utilities
 *
 * Functions for sending push notifications from the server to subscribed clients.
 * This file contains utilities for when you want to send notifications from your backend.
 */

import type {
  TournamentNotification,
  TournamentNotificationType,
} from "./types";

/**
 * Predefined tournament notification creators
 * Use these to create consistent notification objects for common tournament events
 */
export class TournamentNotifications {
  /**
   * Creates a tournament start notification
   */
  static tournamentStart(tournamentName: string): TournamentNotification {
    return {
      type: "tournament_start",
      title: "🏌️ Tournament Started!",
      body: `${tournamentName} is now live. Check the leaderboard!`,
      url: "/tournament",
      icon: "/logo192.png",
    };
  }

  /**
   * Creates a round complete notification
   */
  static roundComplete(
    round: number,
    tournamentName: string,
  ): TournamentNotification {
    return {
      type: "round_complete",
      title: `📊 Round ${round} Complete`,
      body: `Round ${round} of ${tournamentName} is finished. See the updated standings!`,
      url: "/tournament",
      icon: "/logo192.png",
    };
  }

  /**
   * Creates a final results notification
   */
  static finalResults(
    winner: string,
    tournamentName: string,
  ): TournamentNotification {
    return {
      type: "final_results",
      title: "🏆 Tournament Complete!",
      body: `${winner} wins ${tournamentName}! Check the final results.`,
      url: "/tournament",
      icon: "/logo192.png",
    };
  }

  /**
   * Creates a leaderboard update notification
   */
  static leaderboardUpdate(tournamentName: string): TournamentNotification {
    return {
      type: "leaderboard_update",
      title: "📈 Leaderboard Updated",
      body: `New scores posted for ${tournamentName}. Check your position!`,
      url: "/tournament",
      icon: "/logo192.png",
    };
  }

  /**
   * Creates a standings update notification
   */
  static standingsUpdate(): TournamentNotification {
    return {
      type: "standings_update",
      title: "🏅 Season Standings Updated",
      body: "Tour standings have been updated. See where you rank!",
      url: "/standings",
      icon: "/logo192.png",
    };
  }
}

/**
 * Server-side push notification sender
 *
 * Note: This requires the 'web-push' npm package to be installed and configured
 * with VAPID keys. Use this class when you want to send notifications from your
 * server (e.g., in API routes, cron jobs, etc.)
 *
 * @example
 * ```typescript
 * const sender = new PushNotificationSender();
 * const notification = TournamentNotifications.tournamentStart("PGC Championship");
 * await sender.sendToSubscriptions(subscriptions, notification);
 * ```
 */
export class PushNotificationSender {
  /**
   * Sends a notification to multiple push subscriptions
   *
   * @param subscriptions - Array of push subscription objects from your database
   * @param notification - The notification content to send
   */
  async sendToSubscriptions(
    subscriptions: Array<{
      endpoint: string;
      p256dh: string;
      auth: string;
    }>,
    notification: TournamentNotification,
  ): Promise<void> {
    // This is a placeholder implementation
    // You'll need to implement this with the web-push library
    // when you're ready to send server-side notifications

    console.log("TODO: Implement server-side push notification sending");
    console.log("Subscriptions:", subscriptions.length);
    console.log("Notification:", notification);

    // Example implementation (requires web-push package):
    /*
    const webpush = require('web-push');
    
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || "/logo192.png",
      badge: "/logo192.png",
      url: notification.url || "/",
      data: {
        type: notification.type,
        tournamentId: notification.tournamentId,
        timestamp: Date.now(),
      },
    });

    const promises = subscriptions.map((sub) => {
      return webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }, payload).catch((error) => {
        console.error("Error sending notification:", error);
      });
    });

    await Promise.all(promises);
    */
  }
}
