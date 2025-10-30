import { v4 as uuidv4 } from 'uuid';
import { Team, Match } from '../types.js';
import { db } from '../models/Database.js';

/**
 * Swiss rendszerű párosítási szolgáltatás
 */
export class SwissService {
  /**
   * Új Swiss forduló generálása
   *
   * Szabályok:
   * - Azonos pontszámú csapatok kerülnek párosításra
   * - Két csapat nem játszhat egymással kétszer
   * - Ha páratlan számú csapat van, egy "bye" kerül kiosztásra (automatikus győzelem)
   */
  generateRound(): Match[] {
    const config = db.getConfig();
    const currentRound = config.currentRound + 1;

    // Csapatok lekérése és rendezése pontszám alapján
    const teams = this.getSortedTeams();

    if (teams.length === 0) {
      throw new Error('No teams available for pairing');
    }

    // Párosítás generálása
    const matches = this.pairTeams(teams, currentRound);

    // Meccsek mentése
    matches.forEach(match => db.addMatch(match));

    // Config frissítése
    db.updateConfig({ currentRound });

    return matches;
  }

  /**
   * Csapatok rendezése pontszám alapján (ranglista)
   *
   * Sorrend:
   * 1. Győzelmek száma
   * 2. Round különbség (pontszámok különbsége)
   * 3. Buchholz score (ellenfelek összesített pontszáma)
   */
  private getSortedTeams(): Team[] {
    const teams = db.getAllTeams();

    // Buchholz score kalkulálása minden csapathoz
    teams.forEach(team => {
      team.buchholzScore = this.calculateBuchholz(team);
    });

    return teams.sort((a, b) => {
      // 1. Győzelmek
      if (b.totalWins !== a.totalWins) {
        return b.totalWins - a.totalWins;
      }
      // 2. Round különbség
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // 3. Buchholz
      return (b.buchholzScore || 0) - (a.buchholzScore || 0);
    });
  }

  /**
   * Buchholz score: az ellenfelek összesített GYŐZELMEINEK száma
   * (Tie-breaker metric - nem a round diff, hanem a match wins!)
   */
  private calculateBuchholz(team: Team): number {
    let score = 0;
    team.matchHistory.forEach(opponentId => {
      const opponent = db.getTeam(opponentId);
      if (opponent) {
        score += opponent.totalWins;
      }
    });
    return score;
  }

  /**
   * Csapatok párosítása Swiss algoritmus alapján
   */
  private pairTeams(teams: Team[], round: number): Match[] {
    const matches: Match[] = [];
    const paired = new Set<string>();

    // Másolat készítése, hogy ne módosítsuk az eredetit
    const availableTeams = [...teams];

    while (availableTeams.length > 1) {
      const teamA = availableTeams.shift()!;

      if (paired.has(teamA.id)) continue;

      // Keres egy megfelelő ellenfelet
      let teamBIndex = -1;
      for (let i = 0; i < availableTeams.length; i++) {
        const teamB = availableTeams[i];

        if (paired.has(teamB.id)) continue;

        // Ellenőrzi, hogy játszottak-e már egymással
        if (!teamA.matchHistory.includes(teamB.id)) {
          teamBIndex = i;
          break;
        }
      }

      // Ha találtunk ellenfelet
      if (teamBIndex >= 0) {
        const teamB = availableTeams.splice(teamBIndex, 1)[0];

        matches.push({
          id: uuidv4(),
          round,
          teamAId: teamA.id,
          teamBId: teamB.id,
          scoreA: null,
          scoreB: null,
          winnerId: null,
          status: 'pending',
          phase: 'swiss'
        });

        paired.add(teamA.id);
        paired.add(teamB.id);
      } else {
        // Ha nem találtunk ellenfelet, "bye" kiosztása
        // (automatikus győzelem 16-0 ponttal)
        const byeMatch: Match = {
          id: uuidv4(),
          round,
          teamAId: teamA.id,
          teamBId: 'BYE',
          scoreA: 16,
          scoreB: 0,
          winnerId: teamA.id,
          status: 'completed',
          phase: 'swiss'
        };

        matches.push(byeMatch);
        paired.add(teamA.id);

        // Frissíti a csapat statisztikáit
        this.updateTeamAfterMatch(teamA.id, 16, 0, true);
      }
    }

    // Ha maradt páratlan csapat (bye)
    if (availableTeams.length === 1) {
      const teamA = availableTeams[0];

      const byeMatch: Match = {
        id: uuidv4(),
        round,
        teamAId: teamA.id,
        teamBId: 'BYE',
        scoreA: 16,
        scoreB: 0,
        winnerId: teamA.id,
        status: 'completed',
        phase: 'swiss'
      };

      matches.push(byeMatch);
      this.updateTeamAfterMatch(teamA.id, 16, 0, true);
    }

    return matches;
  }

  /**
   * Csapat statisztikáinak frissítése meccs után
   */
  updateTeamAfterMatch(
    teamId: string,
    scoreFor: number,
    scoreAgainst: number,
    won: boolean
  ): void {
    const team = db.getTeam(teamId);
    if (!team) return;

    const roundDiff = scoreFor - scoreAgainst;

    db.updateTeam(teamId, {
      totalPoints: team.totalPoints + roundDiff,
      totalWins: won ? team.totalWins + 1 : team.totalWins,
      totalLosses: !won ? team.totalLosses + 1 : team.totalLosses
    });
  }

  /**
   * Meccs eredmény rögzítése
   */
  recordMatchResult(
    matchId: string,
    scoreA: number,
    scoreB: number
  ): Match {
    const match = db.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Match already completed');
    }

    const winnerId = scoreA > scoreB ? match.teamAId : match.teamBId;

    // Meccs frissítése
    db.updateMatch(matchId, {
      scoreA,
      scoreB,
      winnerId,
      status: 'completed'
    });

    // Team A statisztikák és history frissítése
    if (match.teamBId !== 'BYE') {
      this.updateTeamAfterMatch(match.teamAId, scoreA, scoreB, scoreA > scoreB);

      // Match history frissítése (FRISS team objektumot kérünk le!)
      const freshTeamA = db.getTeam(match.teamAId);
      if (freshTeamA && !freshTeamA.matchHistory.includes(match.teamBId)) {
        freshTeamA.matchHistory.push(match.teamBId);
        db.updateTeam(freshTeamA.id, freshTeamA);
      }
    }

    // Team B statisztikák és history frissítése
    if (match.teamBId !== 'BYE') {
      this.updateTeamAfterMatch(match.teamBId, scoreB, scoreA, scoreB > scoreA);

      // Match history frissítése (FRISS team objektumot kérünk le!)
      const freshTeamB = db.getTeam(match.teamBId);
      if (freshTeamB && !freshTeamB.matchHistory.includes(match.teamAId)) {
        freshTeamB.matchHistory.push(match.teamAId);
        db.updateTeam(freshTeamB.id, freshTeamB);
      }
    }

    return db.getMatch(matchId)!;
  }

  /**
   * Aktuális ranglista lekérése
   */
  getStandings() {
    const teams = this.getSortedTeams();

    return teams.map((team, index) => ({
      rank: index + 1,
      team,
      matchWins: team.totalWins,
      roundDifference: team.totalPoints,
      buchholzScore: team.buchholzScore || 0
    }));
  }

  /**
   * Ellenőrzi, hogy az összes Swiss forduló befejeződött-e
   */
  isSwissPhaseComplete(): boolean {
    const config = db.getConfig();
    const swissMatches = db.getMatchesByPhase('swiss');
    const completedMatches = swissMatches.filter(m => m.status === 'completed');

    return (
      config.currentRound >= config.swissRounds &&
      completedMatches.length === swissMatches.length
    );
  }
}

export const swissService = new SwissService();
