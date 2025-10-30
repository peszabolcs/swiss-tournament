import { Team, Match, TournamentConfig } from '../types.js';

/**
 * In-memory adatbázis (egyszerű implementáció)
 * Éles környezetben MongoDB vagy PostgreSQL ajánlott
 */
class Database {
  private teams: Map<string, Team> = new Map();
  private matches: Map<string, Match> = new Map();
  private config: TournamentConfig = {
    totalTeams: 0,
    swissRounds: 4,
    knockoutSize: 4,
    currentRound: 0,
    currentPhase: 'swiss'
  };

  // ===== TEAMS =====

  addTeam(team: Team): void {
    this.teams.set(team.id, team);
    this.config.totalTeams = this.teams.size;
    this.recalculateSwissRounds();
  }

  getTeam(id: string): Team | undefined {
    return this.teams.get(id);
  }

  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  updateTeam(id: string, updates: Partial<Team>): void {
    const team = this.teams.get(id);
    if (team) {
      this.teams.set(id, { ...team, ...updates });
    }
  }

  // ===== MATCHES =====

  addMatch(match: Match): void {
    this.matches.set(match.id, match);
  }

  getMatch(id: string): Match | undefined {
    return this.matches.get(id);
  }

  getAllMatches(): Match[] {
    return Array.from(this.matches.values());
  }

  getMatchesByRound(round: number): Match[] {
    return this.getAllMatches().filter(m => m.round === round);
  }

  getMatchesByPhase(phase: 'swiss' | 'knockout'): Match[] {
    return this.getAllMatches().filter(m => m.phase === phase);
  }

  updateMatch(id: string, updates: Partial<Match>): void {
    const match = this.matches.get(id);
    if (match) {
      this.matches.set(id, { ...match, ...updates });
    }
  }

  // ===== CONFIG =====

  getConfig(): TournamentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TournamentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Automatikusan kalkulálja az optimális Swiss fordulók számát
   * 10 csapat → 4 forduló
   * 8 csapat → 3 forduló
   * 6 csapat → 3 forduló
   */
  private recalculateSwissRounds(): void {
    const teamCount = this.teams.size;

    if (teamCount >= 10) {
      this.config.swissRounds = 4;
      this.config.knockoutSize = 4;
    } else if (teamCount >= 8) {
      this.config.swissRounds = 3;
      this.config.knockoutSize = 4;
    } else if (teamCount >= 6) {
      this.config.swissRounds = 3;
      this.config.knockoutSize = 4;
    } else {
      this.config.swissRounds = Math.max(2, Math.floor(teamCount / 2));
      this.config.knockoutSize = Math.min(4, teamCount);
    }
  }

  // ===== RESET =====

  reset(): void {
    this.teams.clear();
    this.matches.clear();
    this.config = {
      totalTeams: 0,
      swissRounds: 4,
      knockoutSize: 4,
      currentRound: 0,
      currentPhase: 'swiss'
    };
  }
}

// Singleton instance
export const db = new Database();
