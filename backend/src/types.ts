/**
 * Csapat típusdefiníció
 */
export interface Team {
  id: string;
  name: string;
  totalPoints: number;      // Round különbség (körök különbsége alapján)
  totalScored: number;      // Összes megszerzett pont (Goals For)
  totalWins: number;         // Győzelmek száma
  totalLosses: number;       // Vereségek száma
  buchholzScore?: number;    // Tie-breaker: már nem használt körmérkőzésben
  matchHistory: string[];    // Meccselt csapatok ID-i (ismétlés elkerülésére)
}

/**
 * Veto lépés típus
 */
export interface VetoStep {
  step: number;              // Hanyadik lépés (0-5)
  team: 'teamA' | 'teamB';   // Melyik csapat vétózik
  action: 'ban' | 'side';    // Akció típusa: ban = map bannolás, side = oldal választás
  count: number;             // Hány mapot kell bannolni (2 vagy 1) vagy side választás (0)
  bannedMaps?: string[];     // Ebben a lépésben bannolt mapok
  sideChoice?: 'T' | 'CT';   // Választott oldal (csak step 5-nél)
}

/**
 * Veto progress
 */
export interface VetoProgress {
  completed: boolean;        // Befejeződött-e a veto
  currentStep: number;       // Jelenlegi lépés (0-5)
  availableMaps: string[];   // Még választható mapok
  bannedMaps: string[];      // Összes bannolt map
  steps: VetoStep[];         // Veto lépések története
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
  vetoStarter: 'teamA' | 'teamB';  // Melyik csapat kezdi a map veto-t
  sideChoice: {              // Oldalválasztás információk
    starter: 'teamA' | 'teamB';  // Melyik csapat választhat először
    side: 'T' | 'CT';        // Melyik oldalon kezd a starter csapat
  };
  vetoTimestamp?: number;    // Veto sorsolás időpontja (logolás céljából)
  vetoProgress?: VetoProgress; // Veto folyamat állapota
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
