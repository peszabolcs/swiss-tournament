import { Router, Request, Response } from 'express';
import { db } from '../models/Database.js';
import { swissService } from '../services/SwissService.js';
import { knockoutService } from '../services/KnockoutService.js';

const router = Router();

/**
 * GET /api/matches/all
 * Összes meccs lekérése
 */
router.get('/all', (req: Request, res: Response) => {
  try {
    const matches = db.getAllMatches();

    res.json({
      success: true,
      matches,
      count: matches.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/current
 * Aktuális kör meccsei
 */
router.get('/current', (req: Request, res: Response) => {
  try {
    const config = db.getConfig();
    const matches = db.getMatchesByRound(config.currentRound);

    // Csapat adatok hozzáadása
    const enrichedMatches = matches.map(match => {
      const teamA = db.getTeam(match.teamAId);
      const teamB = match.teamBId !== 'BYE' ? db.getTeam(match.teamBId) : null;

      return {
        ...match,
        teamA,
        teamB: teamB || { id: 'BYE', name: 'BYE' }
      };
    });

    res.json({
      success: true,
      round: config.currentRound,
      phase: config.currentPhase,
      matches: enrichedMatches
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/swiss
 * Swiss fázis meccsei
 */
router.get('/swiss', (req: Request, res: Response) => {
  try {
    const matches = db.getMatchesByPhase('swiss');

    res.json({
      success: true,
      matches
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/matches/knockout
 * Knockout fázis meccsei
 */
router.get('/knockout', (req: Request, res: Response) => {
  try {
    const matches = db.getMatchesByPhase('knockout');

    res.json({
      success: true,
      matches
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/matches/result
 * Meccs eredmény rögzítése
 */
router.post('/result', (req: Request, res: Response) => {
  try {
    const { matchId, scoreA, scoreB } = req.body;

    if (!matchId || scoreA === undefined || scoreB === undefined) {
      return res.status(400).json({
        error: 'matchId, scoreA, and scoreB are required'
      });
    }

    if (typeof scoreA !== 'number' || typeof scoreB !== 'number') {
      return res.status(400).json({
        error: 'Scores must be numbers'
      });
    }

    const match = db.getMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Fázis alapján különböző kezelés
    if (match.phase === 'swiss') {
      const updatedMatch = swissService.recordMatchResult(matchId, scoreA, scoreB);
      res.json({
        success: true,
        match: updatedMatch
      });
    } else {
      knockoutService.recordBracketResult(matchId, scoreA, scoreB);
      const updatedMatch = db.getMatch(matchId);
      res.json({
        success: true,
        match: updatedMatch
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/matches/:id/reroll
 * Veto és side-choice újra sorsolása (Admin funkció)
 */
router.patch('/:id/reroll', (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;

    const updatedMatch = swissService.rerollVetoAndSide(matchId);

    // Csapat adatok hozzáadása
    const teamA = db.getTeam(updatedMatch.teamAId);
    const teamB = updatedMatch.teamBId !== 'BYE' ? db.getTeam(updatedMatch.teamBId) : null;

    res.json({
      success: true,
      match: {
        ...updatedMatch,
        teamA,
        teamB: teamB || { id: 'BYE', name: 'BYE' }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/matches/:id/veto
 * Veto lépés végrehajtása
 *
 * Body: { bannedMaps?: string[], sideChoice?: 'T' | 'CT' }
 */
router.post('/:id/veto', (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const { bannedMaps, sideChoice } = req.body;

    // Step 0-4: Map ban
    if (bannedMaps !== undefined) {
      if (!Array.isArray(bannedMaps)) {
        return res.status(400).json({
          error: 'bannedMaps must be an array'
        });
      }
      const updatedMatch = swissService.executeVetoStep(matchId, bannedMaps);

      // Csapat adatok hozzáadása
      const teamA = db.getTeam(updatedMatch.teamAId);
      const teamB = updatedMatch.teamBId !== 'BYE' ? db.getTeam(updatedMatch.teamBId) : null;

      return res.json({
        success: true,
        match: {
          ...updatedMatch,
          teamA,
          teamB: teamB || { id: 'BYE', name: 'BYE' }
        }
      });
    }

    // Step 5: Side choice
    if (sideChoice !== undefined) {
      if (sideChoice !== 'T' && sideChoice !== 'CT') {
        return res.status(400).json({
          error: 'sideChoice must be "T" or "CT"'
        });
      }
      const updatedMatch = swissService.executeVetoStep(matchId, [], sideChoice);

      // Csapat adatok hozzáadása
      const teamA = db.getTeam(updatedMatch.teamAId);
      const teamB = updatedMatch.teamBId !== 'BYE' ? db.getTeam(updatedMatch.teamBId) : null;

      return res.json({
        success: true,
        match: {
          ...updatedMatch,
          teamA,
          teamB: teamB || { id: 'BYE', name: 'BYE' }
        }
      });
    }

    return res.status(400).json({
      error: 'Either bannedMaps or sideChoice is required'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
