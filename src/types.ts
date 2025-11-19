export interface Team {
  id: string;
  name: string;
  totalPoints: number;
  totalWins: number;
  totalLosses: number;
  buchholzScore?: number;
  matchHistory: string[];
}

export interface VetoStep {
  step: number;
  team: 'teamA' | 'teamB';
  action: 'ban' | 'side';
  count: number;
  bannedMaps?: string[];
  sideChoice?: 'T' | 'CT';
}

export interface VetoProgress {
  completed: boolean;
  currentStep: number;
  availableMaps: string[];
  bannedMaps: string[];
  steps: VetoStep[];
}

export interface Match {
  id: string;
  round: number;
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  status: 'pending' | 'completed';
  phase: 'swiss' | 'knockout';
  map: string;
  vetoStarter: 'teamA' | 'teamB';
  sideChoice: {
    starter: 'teamA' | 'teamB';
    side: 'T' | 'CT';
  };
  vetoTimestamp?: number;
  vetoProgress?: VetoProgress;
  teamA?: Team;
  teamB?: Team | { id: string; name: string };
}

export interface Standing {
  rank: number;
  team: Team;
  matchWins: number;
  roundDifference: number;
  buchholzScore: number;
}

export interface BracketMatch {
  id: string;
  round: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: 'pending' | 'completed';
  position: number;
  map: string;
  teamA?: Team | null;
  teamB?: Team | null;
}

export interface TournamentConfig {
  totalTeams: number;
  swissRounds: number;
  knockoutSize: number;
  currentRound: number;
  currentPhase: 'swiss' | 'knockout';
}
