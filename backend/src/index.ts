import express from 'express';
import cors from 'cors';
import teamsRouter from './routes/teams.js';
import matchesRouter from './routes/matches.js';
import tournamentRouter from './routes/tournament.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/teams', teamsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/tournament', tournamentRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Swiss Tournament Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - POST /api/teams - Register team`);
  console.log(`   - GET  /api/teams - Get all teams`);
  console.log(`   - POST /api/tournament/generate-round - Generate Swiss round`);
  console.log(`   - GET  /api/tournament/standings - Get standings`);
  console.log(`   - POST /api/matches/result - Record match result`);
  console.log(`   - GET  /api/matches/current - Get current round matches`);
  console.log(`   - POST /api/tournament/generate-bracket - Generate knockout bracket`);
  console.log(`   - GET  /api/tournament/bracket - Get bracket`);
});
