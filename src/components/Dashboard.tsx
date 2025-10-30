import { useState, useEffect } from 'react';
import { api } from '../api';
import { Standing, TournamentConfig } from '../types';

export default function Dashboard() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [standingsData, configData] = await Promise.all([
        api.getStandings(),
        api.getConfig()
      ]);
      setStandings(standingsData);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink mb-2">
          CS2 Swiss Tournament
        </h1>
        <p className="text-gray-400 text-lg">Dashboard & Standings</p>
      </div>

      {/* Tournament Info */}
      {config && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Total Teams</div>
            <div className="text-3xl font-bold text-neon-blue">{config.totalTeams}</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Current Phase</div>
            <div className="text-3xl font-bold text-neon-purple capitalize">{config.currentPhase}</div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Current Round</div>
            <div className="text-3xl font-bold text-neon-pink">
              {config.currentRound}/{config.swissRounds}
            </div>
          </div>
          <div className="card">
            <div className="text-gray-400 text-sm mb-1">Knockout Size</div>
            <div className="text-3xl font-bold text-green-400">Top {config.knockoutSize}</div>
          </div>
        </div>
      )}

      {/* Standings Table */}
      <div className="card">
        <h2 className="card-header">Current Standings</h2>

        {standings.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No teams registered yet. Add teams to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-dark-border">
                  <th className="py-3 px-4 text-gray-400 font-semibold">Rank</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold">Team</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold text-center">Wins</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold text-center">Losses</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold text-center">Round Diff</th>
                  <th className="py-3 px-4 text-gray-400 font-semibold text-center">Buchholz</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => (
                  <tr key={standing.team.id} className="table-row">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {standing.rank <= 4 ? (
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold">
                            {standing.rank}
                          </span>
                        ) : (
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-dark-border text-gray-400 font-bold">
                            {standing.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-lg">{standing.team.name}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge badge-win">{standing.matchWins}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge badge-loss">{standing.team.totalLosses}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${standing.roundDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {standing.roundDifference >= 0 ? '+' : ''}{standing.roundDifference}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">
                      {standing.buchholzScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
