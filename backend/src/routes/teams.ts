import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/Database.js';
import { Team } from '../types.js';

const router = Router();

/**
 * POST /api/teams
 * Új csapat regisztrálása
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Ellenőrzi, hogy létezik-e már ilyen nevű csapat
    const existingTeams = db.getAllTeams();
    if (existingTeams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    const team: Team = {
      id: uuidv4(),
      name: name.trim(),
      totalPoints: 0,
      totalScored: 0,
      totalWins: 0,
      totalLosses: 0,
      buchholzScore: 0,
      matchHistory: []
    };

    db.addTeam(team);

    res.status(201).json({
      success: true,
      team
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/teams
 * Összes csapat lekérdezése
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const teams = db.getAllTeams();

    res.json({
      success: true,
      teams,
      count: teams.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/teams/:id
 * Egyedi csapat lekérdezése
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const team = db.getTeam(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      success: true,
      team
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
