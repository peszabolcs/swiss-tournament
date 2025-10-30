import { useState, useEffect } from 'react';
import { api } from '../api';
import { BracketMatch } from '../types';

export default function KnockoutBracket() {
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ [matchId: string]: { scoreA: string; scoreB: string } }>({});

  useEffect(() => {
    fetchBracket();
  }, []);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const data = await api.getBracket();
      setBracket(data);
    } catch (error) {
      console.error('Failed to fetch bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!confirm('Generate knockout bracket? This will finalize the Swiss phase.')) return;

    try {
      await api.generateBracket();
      await fetchBracket();
      alert('Knockout bracket generated!');
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
      await fetchBracket();

      // Clear scores
      const newScores = { ...scores };
      delete newScores[matchId];
      setScores(newScores);

      alert('Match result recorded!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getRoundMatches = (round: string) => {
    return bracket.filter(m => m.round === round);
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
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue mb-2">
            Knockout Phase
          </h1>
          <p className="text-gray-400 text-lg">Single Elimination Bracket</p>
        </div>

        {bracket.length === 0 && (
          <button
            onClick={handleGenerateBracket}
            className="btn-primary"
          >
            Generate Bracket
          </button>
        )}
      </div>

      {bracket.length === 0 ? (
        <div className="card">
          <div className="text-center text-gray-400 py-8">
            Knockout bracket not generated yet. Complete Swiss phase first!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quarterfinals */}
          {getRoundMatches('quarterfinals').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-neon-blue mb-4 text-center">
                Quarterfinals
              </h2>
              <div className="space-y-4">
                {getRoundMatches('quarterfinals').map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    scores={scores}
                    onScoreChange={handleScoreChange}
                    onSubmit={handleSubmitResult}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Semifinals */}
          {getRoundMatches('semifinals').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-neon-purple mb-4 text-center">
                Semifinals
              </h2>
              <div className="space-y-4">
                {getRoundMatches('semifinals').map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    scores={scores}
                    onScoreChange={handleScoreChange}
                    onSubmit={handleSubmitResult}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Finals */}
          {getRoundMatches('finals').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-neon-pink mb-4 text-center">
                Finals
              </h2>
              <div className="space-y-4">
                {getRoundMatches('finals').map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    scores={scores}
                    onScoreChange={handleScoreChange}
                    onSubmit={handleSubmitResult}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BracketMatchCardProps {
  match: BracketMatch;
  scores: { [matchId: string]: { scoreA: string; scoreB: string } };
  onScoreChange: (matchId: string, team: 'A' | 'B', value: string) => void;
  onSubmit: (matchId: string) => void;
}

function BracketMatchCard({ match, scores, onScoreChange, onSubmit }: BracketMatchCardProps) {
  return (
    <div className="card">
      {/* Team A */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className={`font-semibold ${match.winnerId === match.teamAId ? 'text-green-400' : 'text-gray-300'}`}>
            {match.teamA?.name || 'TBD'}
          </div>
        </div>
        {match.status === 'completed' ? (
          <div className="text-xl font-bold">{match.scoreA}</div>
        ) : (
          <input
            type="number"
            min="0"
            max="16"
            placeholder="0"
            value={scores[match.id]?.scoreA || ''}
            onChange={(e) => onScoreChange(match.id, 'A', e.target.value)}
            className="input-field w-16 text-center"
          />
        )}
      </div>

      {/* Team B */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className={`font-semibold ${match.winnerId === match.teamBId ? 'text-green-400' : 'text-gray-300'}`}>
            {match.teamB?.name || 'TBD'}
          </div>
        </div>
        {match.status === 'completed' ? (
          <div className="text-xl font-bold">{match.scoreB}</div>
        ) : (
          <input
            type="number"
            min="0"
            max="16"
            placeholder="0"
            value={scores[match.id]?.scoreB || ''}
            onChange={(e) => onScoreChange(match.id, 'B', e.target.value)}
            className="input-field w-16 text-center"
          />
        )}
      </div>

      {/* Submit Button */}
      {match.status === 'pending' && match.teamAId && match.teamBId && (
        <button
          onClick={() => onSubmit(match.id)}
          className="btn-secondary w-full mt-3 py-2 text-sm"
        >
          Submit Result
        </button>
      )}

      {match.status === 'completed' && (
        <div className="mt-3 text-center">
          <span className="badge badge-win">Completed</span>
        </div>
      )}
    </div>
  );
}
