import { useState, useEffect } from 'react';
import { api } from '../api';
import { Match, TournamentConfig } from '../types';

export default function SwissPhase() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ [matchId: string]: { scoreA: string; scoreB: string } }>({});
  const [selectedMaps, setSelectedMaps] = useState<{ [matchId: string]: string[] }>({});

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

  const handleRerollVeto = async (matchId: string) => {
    if (!confirm('Are you sure you want to re-roll the veto and side choice for this match?')) {
      return;
    }

    try {
      await api.rerollVetoAndSide(matchId);
      await fetchData();
      alert('Veto and side choice re-rolled successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getTeamName = (match: Match, team: 'A' | 'B'): string => {
    if (team === 'A') {
      return match.teamA?.name || 'Unknown';
    }
    return match.teamB?.name || 'Unknown';
  };

  const handleMapSelect = (matchId: string, map: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.vetoProgress) return;

    const currentSelection = selectedMaps[matchId] || [];
    const maxSelection = match.vetoProgress.currentStep === 0 ? 2 : 1;

    if (currentSelection.includes(map)) {
      // Deselect
      setSelectedMaps({
        ...selectedMaps,
        [matchId]: currentSelection.filter(m => m !== map)
      });
    } else if (currentSelection.length < maxSelection) {
      // Select
      setSelectedMaps({
        ...selectedMaps,
        [matchId]: [...currentSelection, map]
      });
    }
  };

  const handleVetoSubmit = async (matchId: string) => {
    const bannedMaps = selectedMaps[matchId] || [];
    const match = matches.find(m => m.id === matchId);

    if (!match || !match.vetoProgress) return;

    // Step 5: Side choice handled separately
    if (match.vetoProgress.currentStep === 5) {
      return;
    }

    const expectedCount = match.vetoProgress.currentStep === 0 ? 2 : 1;

    if (bannedMaps.length !== expectedCount) {
      alert(`Please select exactly ${expectedCount} map(s) to ban`);
      return;
    }

    try {
      await api.executeVetoStep(matchId, bannedMaps);
      await fetchData();

      // Clear selection
      const newSelections = { ...selectedMaps };
      delete newSelections[matchId];
      setSelectedMaps(newSelections);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSideChoice = async (matchId: string, side: 'T' | 'CT') => {
    try {
      await api.executeVetoStep(matchId, undefined, side);
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getCurrentVetoTeam = (match: Match): string => {
    if (!match.vetoProgress) return '';

    const { currentStep } = match.vetoProgress;
    const isStarterTurn = currentStep % 2 === 0;
    const team = isStarterTurn ? match.vetoStarter : (match.vetoStarter === 'teamA' ? 'teamB' : 'teamA');

    return getTeamName(match, team === 'teamA' ? 'A' : 'B');
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
              {/* Map Info & Veto/Side Info */}
              <div className="mb-3 pb-3 border-b border-dark-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 uppercase mr-2">Map:</span>
                    <span className="text-sm font-bold text-neon-pink">{match.map}</span>
                  </div>
                  {match.status === 'pending' && match.vetoProgress?.completed && (
                    <button
                      onClick={() => handleRerollVeto(match.id)}
                      className="text-xs px-2 py-1 bg-dark-border hover:bg-neon-purple/20 text-gray-300 rounded transition-all"
                      title="Re-roll veto and side"
                    >
                      🎲 Re-roll
                    </button>
                  )}
                </div>

                {/* Veto UI - csak ha nincs befejezve */}
                {match.vetoProgress && !match.vetoProgress.completed ? (
                  <div className="bg-dark-bg rounded p-3 mt-2">
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">
                        Step {match.vetoProgress.currentStep + 1} of 6
                      </div>
                      <div className="text-neon-blue font-bold">
                        {match.vetoProgress.currentStep === 5
                          ? `${getCurrentVetoTeam(match)}'s turn to choose starting side`
                          : `${getCurrentVetoTeam(match)}'s turn to ban ${match.vetoProgress.currentStep === 0 ? '2 maps' : '1 map'}`
                        }
                      </div>
                    </div>

                    {/* Step 5: Side Choice */}
                    {match.vetoProgress.currentStep === 5 ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleSideChoice(match.id, 'T')}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-all"
                        >
                          Start as T (Terrorist)
                        </button>
                        <button
                          onClick={() => handleSideChoice(match.id, 'CT')}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all"
                        >
                          Start as CT (Counter-Terrorist)
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Available Maps */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {match.vetoProgress.availableMaps.map(map => {
                            const isSelected = (selectedMaps[match.id] || []).includes(map);
                            return (
                              <button
                                key={map}
                                onClick={() => handleMapSelect(match.id, map)}
                                className={`
                                  px-3 py-2 rounded text-sm font-semibold transition-all
                                  ${isSelected
                                    ? 'bg-red-500 text-white border-2 border-red-400'
                                    : 'bg-dark-border text-gray-300 hover:bg-neon-purple/20 border-2 border-transparent'
                                  }
                                `}
                              >
                                {map}
                              </button>
                            );
                          })}
                        </div>

                        {/* Banned Maps History */}
                        {match.vetoProgress.bannedMaps.length > 0 && (
                          <div className="mb-3 text-xs">
                            <div className="text-gray-500 mb-1">Banned:</div>
                            <div className="flex flex-wrap gap-1">
                              {match.vetoProgress.bannedMaps.map(map => (
                                <span key={map} className="px-2 py-1 bg-red-900/30 text-red-400 rounded">
                                  {map}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          onClick={() => handleVetoSubmit(match.id)}
                          disabled={(selectedMaps[match.id] || []).length !== (match.vetoProgress.currentStep === 0 ? 2 : 1)}
                          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Ban Selected ({(selectedMaps[match.id] || []).length}/{match.vetoProgress.currentStep === 0 ? 2 : 1})
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  /* Veto & Side Choice Info - csak befejezett veto után */
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-dark-bg rounded p-2">
                      <div className="text-gray-500 mb-1">Veto Starter:</div>
                      <div className="text-neon-blue font-semibold">
                        {getTeamName(match, match.vetoStarter === 'teamA' ? 'A' : 'B')}
                      </div>
                    </div>
                    <div className="bg-dark-bg rounded p-2">
                      <div className="text-gray-500 mb-1">Starting Side:</div>
                      <div className="text-neon-purple font-semibold">
                        {getTeamName(match, match.sideChoice.starter === 'teamA' ? 'A' : 'B')} → {match.sideChoice.side}
                      </div>
                    </div>
                  </div>
                )}
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
