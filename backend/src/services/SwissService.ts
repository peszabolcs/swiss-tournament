import { v4 as uuidv4 } from 'uuid';
import { Team, Match, VetoProgress } from '../types.js';
import { db } from '../models/Database.js';
import { getRandomMap } from '../utils/mapPool.js';
import { CS2_MAP_POOL } from '../utils/mapPool.js';

/**
 * Körmérkőzéses (Round-Robin) párosítási szolgáltatás
 * Mindenki mindenki ellen játszik egyszer
 */
export class SwissService {
  /**
   * Random veto starter generálás (50-50% esély)
   */
  private generateVetoStarter(): 'teamA' | 'teamB' {
    return Math.random() < 0.5 ? 'teamA' : 'teamB';
  }

  /**
   * Random side-choice generálás (50-50% esély mindkét paraméterre)
   */
  private generateSideChoice(): { starter: 'teamA' | 'teamB'; side: 'T' | 'CT' } {
    const starter = Math.random() < 0.5 ? 'teamA' : 'teamB';
    const side = Math.random() < 0.5 ? 'T' : 'CT';
    return { starter, side };
  }

  /**
   * Veto progress inicializálása új meccshez
   */
  private initializeVetoProgress(): VetoProgress {
    return {
      completed: false,
      currentStep: 0,
      availableMaps: [...CS2_MAP_POOL],
      bannedMaps: [],
      steps: []
    };
  }
  /**
   * Új körmérkőzéses forduló generálása
   *
   * Körmérkőzéses rendszer:
   * - Minden csapat minden másik csapattal pontosan egyszer játszik
   * - Az összes mérkőzés előre meghatározott (round-robin párosítás)
   * - Nincs "bye" - ha páratlan számú csapat van, egy csapat kimarad az adott körből
   */
  generateRound(): Match[] {
    const config = db.getConfig();
    const currentRound = config.currentRound + 1;

    // Csapatok lekérése
    const teams = db.getAllTeams();

    if (teams.length === 0) {
      throw new Error('No teams available for pairing');
    }

    if (teams.length < 2) {
      throw new Error('At least 2 teams are required for a tournament');
    }

    // Ha ez az első kör, generáljuk az összes körmérkőzést
    if (currentRound === 1) {
      this.generateAllRounds(teams);
    }

    // Aktuális kör mérkőzéseinek lekérése
    const matches = db.getMatchesByRound(currentRound);

    if (matches.length === 0) {
      throw new Error('No matches found for this round');
    }

    // Config frissítése
    db.updateConfig({ currentRound });

    return matches;
  }

  /**
   * Az összes körmérkőzés előre generálása Round-Robin algoritmussal
   *
   * Round-Robin Scheduling Algorithm:
   * - n csapat esetén n-1 forduló kell (ha n páros) vagy n forduló (ha n páratlan)
   * - Minden csapat minden másik csapattal pontosan egyszer játszik
   * - Páratlan csapat esetén minden körben egy csapat kimarad
   */
  private generateAllRounds(teams: Team[]): void {
    const n = teams.length;
    const totalRounds = n % 2 === 0 ? n - 1 : n;

    // Csapatok tömbje - ha páratlan, hozzáadunk egy "bye" csapatot
    const teamList: (Team | null)[] = [...teams];
    if (n % 2 === 1) {
      teamList.push(null); // "bye" reprezentáció
    }

    const numTeams = teamList.length;

    // Round-Robin algoritmus: forgó asztal módszer
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches: Match[] = [];

      // Párosítások az aktuális körben
      for (let i = 0; i < numTeams / 2; i++) {
        const teamA = teamList[i];
        const teamB = teamList[numTeams - 1 - i];

        // Ha mindkét csapat létezik (nem "bye")
        if (teamA && teamB) {
          const vetoStarter = this.generateVetoStarter();
          const vetoTimestamp = Date.now();
          const vetoProgress = this.initializeVetoProgress();

          roundMatches.push({
            id: uuidv4(),
            round,
            teamAId: teamA.id,
            teamBId: teamB.id,
            scoreA: null,
            scoreB: null,
            winnerId: null,
            status: 'pending',
            phase: 'swiss',
            map: 'TBD', // Veto után kerül kitöltésre
            vetoStarter,
            sideChoice: {
              starter: 'teamA', // Placeholder, veto végén kerül kitöltésre
              side: 'T'         // Placeholder, veto végén kerül kitöltésre
            },
            vetoTimestamp,
            vetoProgress
          });
        }
      }

      // Meccsek mentése az adatbázisba
      roundMatches.forEach(match => db.addMatch(match));

      // Csapatok forgatása (az első csapat fix marad, a többi forog)
      if (round < totalRounds) {
        const fixed = teamList[0];
        const rotating = teamList.slice(1);
        rotating.unshift(rotating.pop()!);
        teamList[0] = fixed;
        for (let i = 0; i < rotating.length; i++) {
          teamList[i + 1] = rotating[i];
        }
      }
    }

    // Frissítjük a config-ot, hogy tudjuk hány kör lesz összesen
    db.updateConfig({ swissRounds: totalRounds });
  }

  /**
   * Csapatok rendezése pontszám alapján (ranglista)
   *
   * Sorrend:
   * 1. Győzelmek száma
   * 2. Round különbség (pontszámok különbsége)
   * 3. Összes megszerzett pont (Goals For / totalScored)
   */
  private getSortedTeams(): Team[] {
    const teams = db.getAllTeams();

    return teams.sort((a, b) => {
      // 1. Győzelmek
      if (b.totalWins !== a.totalWins) {
        return b.totalWins - a.totalWins;
      }
      // 2. Round különbség
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // 3. Összes megszerzett pont (Goals For)
      return b.totalScored - a.totalScored;
    });
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
      totalScored: team.totalScored + scoreFor,  // Összes megszerzett pont
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
      buchholzScore: team.totalScored  // Goals For (összes megszerzett pont)
    }));
  }

  /**
   * Ellenőrzi, hogy az összes körmérkőzés befejeződött-e
   */
  isTournamentComplete(): boolean {
    const config = db.getConfig();
    const allMatches = db.getAllMatches();
    const completedMatches = allMatches.filter(m => m.status === 'completed');

    return (
      config.currentRound >= config.swissRounds &&
      completedMatches.length === allMatches.length
    );
  }

  /**
   * Veto és side-choice újra sorsolása egy meccshez
   * (Admin funkció)
   */
  rerollVetoAndSide(matchId: string): Match {
    const match = db.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Cannot reroll a completed match');
    }

    const vetoStarter = this.generateVetoStarter();
    const sideChoice = this.generateSideChoice();
    const vetoTimestamp = Date.now();
    const vetoProgress = this.initializeVetoProgress();

    db.updateMatch(matchId, {
      vetoStarter,
      sideChoice,
      vetoTimestamp,
      vetoProgress
    });

    return db.getMatch(matchId)!;
  }

  /**
   * Veto lépés végrehajtása
   *
   * Veto folyamat:
   * Step 0: vetoStarter - ban 2 maps (7 → 5)
   * Step 1: other team - ban 1 map (5 → 4)
   * Step 2: vetoStarter - ban 1 map (4 → 3)
   * Step 3: other team - ban 1 map (3 → 2)
   * Step 4: vetoStarter - ban 1 map (2 → 1)
   * Step 5: other team - választja T vagy CT
   * Végeredmény: 1 map marad + side choice
   */
  executeVetoStep(matchId: string, bannedMaps: string[], sideChoice?: 'T' | 'CT'): Match {
    const match = db.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'completed') {
      throw new Error('Cannot veto a completed match');
    }

    if (!match.vetoProgress) {
      throw new Error('Veto progress not initialized');
    }

    if (match.vetoProgress.completed) {
      throw new Error('Veto already completed');
    }

    const { currentStep, availableMaps, bannedMaps: currentBanned, steps } = match.vetoProgress;

    // Melyik csapat lép
    const currentTeam = this.getCurrentVetoTeam(match.vetoStarter, currentStep);

    // Step 5: Side choice
    if (currentStep === 5) {
      if (!sideChoice) {
        throw new Error('Side choice (T or CT) is required for step 5');
      }

      const newSteps = [...steps, {
        step: currentStep,
        team: currentTeam,
        action: 'side' as const,
        count: 0,
        sideChoice
      }];

      const updatedVetoProgress: VetoProgress = {
        completed: true,
        currentStep: 5,
        availableMaps,
        bannedMaps: currentBanned,
        steps: newSteps
      };

      db.updateMatch(matchId, {
        vetoProgress: updatedVetoProgress,
        sideChoice: {
          starter: currentTeam,
          side: sideChoice
        }
      });

      return db.getMatch(matchId)!;
    }

    // Step 0-4: Map ban
    const expectedBanCount = currentStep === 0 ? 2 : 1;

    // Validálás
    if (bannedMaps.length !== expectedBanCount) {
      throw new Error(`Step ${currentStep} requires exactly ${expectedBanCount} ban(s)`);
    }

    // Ellenőrizze, hogy a bannolt mapok elérhetők-e
    for (const map of bannedMaps) {
      if (!availableMaps.includes(map)) {
        throw new Error(`Map ${map} is not available for banning`);
      }
    }

    // Frissítés
    const newAvailableMaps = availableMaps.filter(m => !bannedMaps.includes(m));
    const newBannedMaps = [...currentBanned, ...bannedMaps];
    const newSteps = [...steps, {
      step: currentStep,
      team: currentTeam,
      action: 'ban' as const,
      count: expectedBanCount,
      bannedMaps
    }];

    const isLastBanStep = currentStep === 4;
    const finalMap = isLastBanStep && newAvailableMaps.length === 1 ? newAvailableMaps[0] : match.map;

    const updatedVetoProgress: VetoProgress = {
      completed: false, // Még nem kész, side choice hiányzik
      currentStep: currentStep + 1,
      availableMaps: newAvailableMaps,
      bannedMaps: newBannedMaps,
      steps: newSteps
    };

    db.updateMatch(matchId, {
      vetoProgress: updatedVetoProgress,
      map: finalMap
    });

    return db.getMatch(matchId)!;
  }

  /**
   * Meghatározza melyik csapat lép a veto folyamatban
   */
  private getCurrentVetoTeam(vetoStarter: 'teamA' | 'teamB', step: number): 'teamA' | 'teamB' {
    const otherTeam = vetoStarter === 'teamA' ? 'teamB' : 'teamA';

    // Step 0: vetoStarter - ban 2
    // Step 1: other - ban 1
    // Step 2: vetoStarter - ban 1
    // Step 3: other - ban 1
    // Step 4: vetoStarter - ban 1
    // Step 5: other - choose side

    return step % 2 === 0 ? vetoStarter : otherTeam;
  }
}

export const swissService = new SwissService();
