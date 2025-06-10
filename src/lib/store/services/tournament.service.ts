import type { Tournament, Course } from "@prisma/client";

export interface ITournamentService {
  getAllTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament>;
  getCurrentTournament(): Promise<Tournament | null>;
  getUpcomingTournaments(): Promise<Tournament[]>;
  getPastTournaments(): Promise<Tournament[]>;
}

class TournamentService implements ITournamentService {
  private baseUrl = "/api/tournaments";

  async getAllTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/all`);
    if (!response.ok) throw new Error("Failed to fetch tournaments");
    const data = await response.json();
    return data.tournaments;
  }

  async getTournament(id: string): Promise<Tournament> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch tournament ${id}`);
    return response.json();
  }

  async getCurrentTournament(): Promise<Tournament | null> {
    const response = await fetch(`${this.baseUrl}/current`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch current tournament");
    return response.json();
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/upcoming`);
    if (!response.ok) throw new Error("Failed to fetch upcoming tournaments");
    const data = await response.json();
    return data.tournaments;
  }

  async getPastTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/past`);
    if (!response.ok) throw new Error("Failed to fetch past tournaments");
    const data = await response.json();
    return data.tournaments;
  }
}

export const tournamentService = new TournamentService();
