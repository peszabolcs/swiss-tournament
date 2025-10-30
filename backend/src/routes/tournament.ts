import { Router, Request, Response } from 'express';
import { db } from '../models/Database.js';
import { swissService } from '../services/SwissService.js';
import { knockoutService } from '../services/KnockoutService.js';

const router = Router();

/**
 * POST /api/tournament/generate-round
 * Új Swiss forduló generálása
 */
router.post('/generate-round', (req: Request, res: Response) => {
  try {
    const config = db.getConfig();

    if (config.currentPhase === 'knockout') {
      return res.status(400).json({
        error: 'Tournament is already in knockout phase'
      });
    }

    if (config.currentRound >= config.swissRounds) {
      return res.status(400).json({
        error: 'All Swiss rounds are completed. Generate bracket instead.'
      });
    }

    const matches = swissService.generateRound();

    // Csapat adatok hozzáadása
    const enrichedMatches = matches.map(match => ({
      ...match,
      teamA: db.getTeam(match.teamAId),
      teamB: match.teamBId !== 'BYE' ? db.getTeam(match.teamBId) : { id: 'BYE', name: 'BYE' }
    }));

    res.json({
      success: true,
      round: config.currentRound + 1,
      matches: enrichedMatches
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournament/standings
 * Aktuális ranglista
 */
router.get('/standings', (req: Request, res: Response) => {
  try {
    const standings = swissService.getStandings();

    res.json({
      success: true,
      standings
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournament/generate-bracket
 * Knockout bracket generálása
 */
router.post('/generate-bracket', (req: Request, res: Response) => {
  try {
    const bracket = knockoutService.generateBracket();

    res.json({
      success: true,
      bracket
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournament/bracket
 * Knockout bracket lekérése
 */
router.get('/bracket', (req: Request, res: Response) => {
  try {
    const bracket = knockoutService.getBracket();

    // Csapat adatok hozzáadása
    const enrichedBracket = bracket.map(match => ({
      ...match,
      teamA: match.teamAId ? db.getTeam(match.teamAId) : null,
      teamB: match.teamBId ? db.getTeam(match.teamBId) : null
    }));

    res.json({
      success: true,
      bracket: enrichedBracket
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournament/config
 * Tournament konfiguráció lekérése
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    const config = db.getConfig();

    res.json({
      success: true,
      config
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournament/reset
 * Tournament reset (fejlesztési célra)
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    db.reset();

    res.json({
      success: true,
      message: 'Tournament reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
