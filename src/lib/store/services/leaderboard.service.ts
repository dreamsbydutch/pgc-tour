import type { Team, Golfer, TourCard } from "@prisma/client";

export interface LeaderboardData {
  teams: (Team & { tourCard: TourCard | null })[];
  golfers: Golfer[];
  lastUpdated: Date;
  metadata: {
    round: number;
    playComplete: boolean;
  };
}

export interface ILeaderboardService {
  getLeaderboard(tournamentId: string): Promise<LeaderboardData>;
  subscribeToUpdates(
    tournamentId: string,
    callback: (data: LeaderboardData) => void,
  ): () => void;
  refreshLeaderboard(tournamentId: string): Promise<LeaderboardData>;
}

class LeaderboardService implements ILeaderboardService {
  private baseUrl = "/api/tournaments";
  private subscriptions = new Map<string, (() => void)[]>();

  async getLeaderboard(tournamentId: string): Promise<LeaderboardData> {
    const response = await fetch(
      `${this.baseUrl}/leaderboard?tournamentId=${tournamentId}`,
      {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch leaderboard for tournament ${tournamentId}`,
      );
    }

    const data = await response.json();

    return {
      teams: data.teams || [],
      golfers: data.golfers || [],
      lastUpdated: new Date(),
      metadata: {
        round: data.round || 1,
        playComplete: data.playComplete || false,
      },
    };
  }

  subscribeToUpdates(
    tournamentId: string,
    callback: (data: LeaderboardData) => void,
  ): () => void {
    // Add callback to subscriptions
    if (!this.subscriptions.has(tournamentId)) {
      this.subscriptions.set(tournamentId, []);
    }

    const callbacks = this.subscriptions.get(tournamentId)!;
    callbacks.push(callback);

    // Start polling for this tournament if it's the first subscription
    if (callbacks.length === 1) {
      this.startPolling(tournamentId);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(tournamentId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }

        // Stop polling if no more subscriptions
        if (callbacks.length === 0) {
          this.stopPolling(tournamentId);
        }
      }
    };
  }

  async refreshLeaderboard(tournamentId: string): Promise<LeaderboardData> {
    const data = await this.getLeaderboard(tournamentId);

    // Notify all subscribers
    const callbacks = this.subscriptions.get(tournamentId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }

    return data;
  }

  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  private startPolling(tournamentId: string): void {
    // Poll every 3 minutes
    const interval = setInterval(
      async () => {
        try {
          await this.refreshLeaderboard(tournamentId);
        } catch (error) {
          console.error(
            `Failed to refresh leaderboard for tournament ${tournamentId}:`,
            error,
          );
        }
      },
      3 * 60 * 1000,
    );

    this.pollingIntervals.set(tournamentId, interval);
  }

  private stopPolling(tournamentId: string): void {
    const interval = this.pollingIntervals.get(tournamentId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(tournamentId);
    }
  }
}

export const leaderboardService = new LeaderboardService();
