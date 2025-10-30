/**
 * Csapat típusdefiníció
 */
export interface Team {
  id: string;
  name: string;
  totalPoints: number;      // Összes pont (körök különbsége alapján)
  totalWins: number;         // Győzelmek száma
  totalLosses: number;       // Vereségek száma
  buchholzScore?: number;    // Tie-breaker: ellenfelek összesített pontszáma
  matchHistory: string[];    // Meccselt csapatok ID-i (ismétlés elkerülésére)
}

/**
 * Meccs típusdefiníció
 */
export interface Match {
  id: string;
  round: number;             // Hanyadik kör
  teamAId: string;
  teamBId: string;
  scoreA: number | null;     // Csapat A pontszáma
  scoreB: number | null;     // Csapat B pontszáma
  winnerId: string | null;   // Győztes csapat ID
  status: 'pending' | 'completed';
  phase: 'swiss' | 'knockout';
  map: string;               // CS2 map (Ancient, Dust2, Inferno, Mirage, Nuke, Overpass, Train)
}

/**
 * Ranglista bejegyzés
 */
export interface Standing {
  team: Team;
  rank: number;
  matchWins: number;
  roundDifference: number;   // Körök különbsége (scoreA - scoreB összege)
  buchholzScore: number;
}

/**
 * Knockout bracket pozíció
 */
export interface BracketMatch {
  id: string;
  round: string;             // 'semifinals', 'finals', stb.
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: 'pending' | 'completed';
  position: number;          // Pozíció a bracket-ben
  map: string;               // CS2 map
}

/**
 * Tournament konfigurálás
 */
export interface TournamentConfig {
  totalTeams: number;
  swissRounds: number;
  knockoutSize: number;      // Hány csapat jut tovább (4, 8, 16)
  currentRound: number;
  currentPhase: 'swiss' | 'knockout';
}
