import { Team, Match, Standing, BracketMatch, TournamentConfig } from './types';

const API_BASE = 'http://localhost:3001/api';

/**
 * API service for tournament backend
 */
class TournamentAPI {
  // ===== TEAMS =====

  async createTeam(name: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create team');
    }

    const data = await response.json();
    return data.team;
  }

  async getTeams(): Promise<Team[]> {
    const response = await fetch(`${API_BASE}/teams`);

    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    const data = await response.json();
    return data.teams;
  }

  async getTeam(id: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch team');
    }

    const data = await response.json();
    return data.team;
  }

  // ===== MATCHES =====

  async getAllMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE}/matches/all`);

    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }

    const data = await response.json();
    return data.matches;
  }

  async getCurrentMatches(): Promise<{ round: number; phase: string; matches: Match[] }> {
    const response = await fetch(`${API_BASE}/matches/current`);

    if (!response.ok) {
      throw new Error('Failed to fetch current matches');
    }

    return await response.json();
  }

  async recordMatchResult(matchId: string, scoreA: number, scoreB: number): Promise<Match> {
    const response = await fetch(`${API_BASE}/matches/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, scoreA, scoreB })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record match result');
    }

    const data = await response.json();
    return data.match;
  }

  // ===== TOURNAMENT =====

  async generateRound(): Promise<Match[]> {
    const response = await fetch(`${API_BASE}/tournament/generate-round`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate round');
    }

    const data = await response.json();
    return data.matches;
  }

  async getStandings(): Promise<Standing[]> {
    const response = await fetch(`${API_BASE}/tournament/standings`);

    if (!response.ok) {
      throw new Error('Failed to fetch standings');
    }

    const data = await response.json();
    return data.standings;
  }

  async generateBracket(): Promise<BracketMatch[]> {
    const response = await fetch(`${API_BASE}/tournament/generate-bracket`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate bracket');
    }

    const data = await response.json();
    return data.bracket;
  }

  async getBracket(): Promise<BracketMatch[]> {
    const response = await fetch(`${API_BASE}/tournament/bracket`);

    if (!response.ok) {
      throw new Error('Failed to fetch bracket');
    }

    const data = await response.json();
    return data.bracket;
  }

  async getConfig(): Promise<TournamentConfig> {
    const response = await fetch(`${API_BASE}/tournament/config`);

    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }

    const data = await response.json();
    return data.config;
  }

  async resetTournament(): Promise<void> {
    const response = await fetch(`${API_BASE}/tournament/reset`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to reset tournament');
    }
  }

  // ===== VETO & SIDE CHOICE =====

  async rerollVetoAndSide(matchId: string): Promise<Match> {
    const response = await fetch(`${API_BASE}/matches/${matchId}/reroll`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reroll veto and side');
    }

    const data = await response.json();
    return data.match;
  }

  async executeVetoStep(matchId: string, bannedMaps?: string[], sideChoice?: 'T' | 'CT'): Promise<Match> {
    const body: any = {};
    if (bannedMaps !== undefined) body.bannedMaps = bannedMaps;
    if (sideChoice !== undefined) body.sideChoice = sideChoice;

    const response = await fetch(`${API_BASE}/matches/${matchId}/veto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute veto step');
    }

    const data = await response.json();
    return data.match;
  }
}

export const api = new TournamentAPI();
