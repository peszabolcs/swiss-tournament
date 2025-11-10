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
    swissRounds: 0, // Automatikusan számolódik a csapatok száma alapján
    knockoutSize: 0, // Már nem használt
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
   * Automatikusan kalkulálja a körmérkőzés fordulóinak számát
   * n csapat esetén: n-1 forduló (páros csapat) vagy n forduló (páratlan)
   */
  private recalculateSwissRounds(): void {
    const teamCount = this.teams.size;

    if (teamCount < 2) {
      this.config.swissRounds = 0;
    } else {
      // Round-robin: n csapat esetén n-1 forduló (ha páros) vagy n (ha páratlan)
      this.config.swissRounds = teamCount % 2 === 0 ? teamCount - 1 : teamCount;
    }

    // Knockout már nem használt
    this.config.knockoutSize = 0;
  }

  // ===== RESET =====

  reset(): void {
    this.teams.clear();
    this.matches.clear();
    this.config = {
      totalTeams: 0,
      swissRounds: 0,
      knockoutSize: 0,
      currentRound: 0,
      currentPhase: 'swiss'
    };
  }
}

// Singleton instance
export const db = new Database();
