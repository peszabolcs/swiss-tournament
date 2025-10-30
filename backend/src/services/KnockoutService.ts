import { v4 as uuidv4 } from 'uuid';
import { Match, BracketMatch } from '../types.js';
import { db } from '../models/Database.js';
import { swissService } from './SwissService.js';
import { getRandomMap } from '../utils/mapPool.js';

/**
 * Knockout (egyenes kieséses) rendszer szolgáltatás
 */
export class KnockoutService {
  /**
   * Knockout bracket generálása a Swiss szakasz után
   *
   * A top N csapat kerül be (4, 8, vagy 16)
   */
  generateBracket(): BracketMatch[] {
    if (!swissService.isSwissPhaseComplete()) {
      throw new Error('Swiss phase is not complete yet');
    }

    const config = db.getConfig();
    const standings = swissService.getStandings();

    // Top N csapat kiválasztása
    const qualifiedTeams = standings
      .slice(0, config.knockoutSize)
      .map(s => s.team);

    if (qualifiedTeams.length < 2) {
      throw new Error('Not enough teams for knockout phase');
    }

    // Bracket generálása
    const bracket = this.createBracket(qualifiedTeams);

    // Config frissítése
    db.updateConfig({
      currentPhase: 'knockout',
      currentRound: 0
    });

    return bracket;
  }

  /**
   * Bracket párosítás létrehozása
   *
   * Seeding: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5 (8 csapat esetén)
   * Vagy: 1 vs 4, 2 vs 3 (4 csapat esetén)
   */
  private createBracket(teams: any[]): BracketMatch[] {
    const bracket: BracketMatch[] = [];
    const size = teams.length;
    let startingRound: number;

    if (size === 4) {
      // Semifinals - kezdő round 101
      startingRound = 101;
      bracket.push(
        this.createBracketMatch(teams[0].id, teams[3].id, 'semifinals', 0, 101),
        this.createBracketMatch(teams[1].id, teams[2].id, 'semifinals', 1, 101)
      );
    } else if (size === 8) {
      // Quarterfinals - kezdő round 100
      startingRound = 100;
      bracket.push(
        this.createBracketMatch(teams[0].id, teams[7].id, 'quarterfinals', 0, 100),
        this.createBracketMatch(teams[1].id, teams[6].id, 'quarterfinals', 1, 100),
        this.createBracketMatch(teams[2].id, teams[5].id, 'quarterfinals', 2, 100),
        this.createBracketMatch(teams[3].id, teams[4].id, 'quarterfinals', 3, 100)
      );
    }

    // Meccsek mentése az adatbázisba
    bracket.forEach(match => {
      const dbMatch: Match = {
        id: match.id,
        round: match.position, // A bracket match position tartalmazza a round számot
        teamAId: match.teamAId!,
        teamBId: match.teamBId!,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        status: 'pending',
        phase: 'knockout',
        map: match.map
      };
      db.addMatch(dbMatch);
    });

    return bracket;
  }

  /**
   * Bracket meccs létrehozása
   */
  private createBracketMatch(
    teamAId: string,
    teamBId: string,
    round: string,
    position: number,
    roundNumber: number
  ): BracketMatch {
    return {
      id: uuidv4(),
      round,
      teamAId,
      teamBId,
      winnerId: null,
      scoreA: null,
      scoreB: null,
      status: 'pending',
      position: roundNumber, // A position mezőt használjuk round number tárolására
      map: getRandomMap()
    };
  }

  /**
   * Knockout meccs eredményének rögzítése
   */
  recordBracketResult(matchId: string, scoreA: number, scoreB: number): void {
    const match = db.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.phase !== 'knockout') {
      throw new Error('This is not a knockout match');
    }

    const winnerId = scoreA > scoreB ? match.teamAId : match.teamBId;

    db.updateMatch(matchId, {
      scoreA,
      scoreB,
      winnerId,
      status: 'completed'
    });

    // Következő kör generálása (semifinals -> finals)
    this.advanceWinner(match, winnerId);
  }

  /**
   * Győztes továbbléptetése a következő körbe
   */
  private advanceWinner(match: Match, winnerId: string): void {
    const allKnockoutMatches = db.getMatchesByPhase('knockout');
    const currentRoundMatches = allKnockoutMatches.filter(
      m => m.round === match.round
    );

    // Ha minden meccs befejeződött az aktuális körben
    const allCompleted = currentRoundMatches.every(m => m.status === 'completed');

    if (allCompleted) {
      const winners = currentRoundMatches.map(m => m.winnerId).filter(Boolean) as string[];

      // Ha van még továbblépés (nem döntő)
      if (winners.length > 1) {
        this.createNextRound(winners, match.round + 1);
      }
    }
  }

  /**
   * Következő kör létrehozása
   */
  private createNextRound(winners: string[], round: number): void {
    const matches: Match[] = [];

    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        matches.push({
          id: uuidv4(),
          round,
          teamAId: winners[i],
          teamBId: winners[i + 1],
          scoreA: null,
          scoreB: null,
          winnerId: null,
          status: 'pending',
          phase: 'knockout',
          map: getRandomMap()
        });
      }
    }

    matches.forEach(m => db.addMatch(m));
  }

  /**
   * Teljes bracket lekérése
   */
  getBracket(): BracketMatch[] {
    const knockoutMatches = db.getMatchesByPhase('knockout');

    return knockoutMatches.map((match, index) => ({
      id: match.id,
      round: this.getRoundName(match.round),
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      winnerId: match.winnerId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status,
      position: index, // Pozíció a listában
      map: match.map
    }));
  }

  /**
   * Round szám -> név konverzió
   *
   * 100 = quarterfinals (8 csapat)
   * 101 = semifinals (4 vagy 8 csapat esetén)
   * 102 = finals (minden esetben)
   */
  private getRoundName(round: number): string {
    if (round === 100) return 'quarterfinals';
    if (round === 101) return 'semifinals';
    if (round === 102) return 'finals';
    return `round_${round}`;
  }
}

export const knockoutService = new KnockoutService();
