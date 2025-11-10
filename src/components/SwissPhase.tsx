import { useState, useEffect } from 'react';
import { api } from '../api';
import { Match, TournamentConfig } from '../types';

export default function SwissPhase() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ [matchId: string]: { scoreA: string; scoreB: string } }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesData, configData] = await Promise.all([
        api.getCurrentMatches(),
        api.getConfig()
      ]);
      setMatches(matchesData.matches);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRound = async () => {
    if (!confirm('Generate next Swiss round?')) return;

    try {
      await api.generateRound();
      await fetchData();
      alert('New round generated successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleScoreChange = (matchId: string, team: 'A' | 'B', value: string) => {
    setScores({
      ...scores,
      [matchId]: {
        ...(scores[matchId] || { scoreA: '', scoreB: '' }),
        [`score${team}`]: value
      }
    });
  };

  const handleSubmitResult = async (matchId: string) => {
    const score = scores[matchId];
    if (!score || score.scoreA === '' || score.scoreB === '') {
      alert('Please enter both scores');
      return;
    }

    const scoreA = parseInt(score.scoreA);
    const scoreB = parseInt(score.scoreB);

    if (isNaN(scoreA) || isNaN(scoreB)) {
      alert('Invalid scores');
      return;
    }

    try {
      await api.recordMatchResult(matchId, scoreA, scoreB);
      await fetchData();

      // Clear scores
      const newScores = { ...scores };
      delete newScores[matchId];
      setScores(newScores);

      alert('Match result recorded!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-neon-blue text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2">
            Round-Robin Matches
          </h1>
          <p className="text-gray-400 text-lg">
            Round {config?.currentRound} of {config?.swissRounds}
          </p>
          {config && config.currentRound >= config.swissRounds && (
            <p className="text-green-400 text-sm mt-1 font-semibold">Tournament Complete!</p>
          )}
        </div>

        {config && config.currentRound < config.swissRounds && (
          <button
            onClick={handleGenerateRound}
            className="btn-primary"
          >
            {config.currentRound === 0 ? 'Start Tournament' : 'Generate Next Round'}
          </button>
        )}
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="card">
          <div className="text-center text-gray-400 py-8">
            No matches yet. Click "Generate Next Round" to start!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => (
            <div key={match.id} className="card">
              {/* Map Info */}
              <div className="mb-3 pb-3 border-b border-dark-border">
                <div className="flex items-center justify-center">
                  <span className="text-xs text-gray-500 uppercase mr-2">Map:</span>
                  <span className="text-sm font-bold text-neon-pink">{match.map}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* Team A */}
                <div className="flex-1">
                  <div className="text-xl font-bold text-neon-blue">
                    {match.teamA?.name || 'Unknown'}
                  </div>
                  {match.status === 'completed' ? (
                    <div className="text-3xl font-bold mt-2">{match.scoreA}</div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="16"
                      placeholder="Score"
                      value={scores[match.id]?.scoreA || ''}
                      onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                      className="input-field w-24 mt-2"
                    />
                  )}
                </div>

                {/* VS */}
                <div className="px-8">
                  <div className="text-gray-500 font-bold text-2xl">VS</div>
                </div>

                {/* Team B */}
                <div className="flex-1 text-right">
                  <div className="text-xl font-bold text-neon-purple">
                    {match.teamB?.name || 'Unknown'}
                  </div>
                  {match.status === 'completed' ? (
                    <div className="text-3xl font-bold mt-2">{match.scoreB}</div>
                  ) : match.teamBId === 'BYE' ? (
                    <div className="text-gray-500 mt-2">BYE</div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="16"
                      placeholder="Score"
                      value={scores[match.id]?.scoreB || ''}
                      onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                      className="input-field w-24 mt-2 text-left"
                    />
                  )}
                </div>

                {/* Submit Button */}
                {match.status === 'pending' && match.teamBId !== 'BYE' && (
                  <div className="ml-8">
                    <button
                      onClick={() => handleSubmitResult(match.id)}
                      className="btn-secondary px-4 py-2"
                    >
                      Save
                    </button>
                  </div>
                )}

                {match.status === 'completed' && (
                  <div className="ml-8">
                    <span className="badge badge-win">Completed</span>
                  </div>
                )}
              </div>

              {/* Winner indicator */}
              {match.status === 'completed' && match.winnerId && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <div className="text-center text-green-400 font-semibold">
                    Winner: {match.winnerId === match.teamAId ? match.teamA?.name : match.teamB?.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
