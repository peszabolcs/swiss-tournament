import { useState, useEffect } from 'react';
import { api } from '../api';
import { Team } from '../types';

export default function AdminPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    try {
      setLoading(true);
      await api.createTeam(teamName.trim());
      setTeamName('');
      await fetchTeams();
      alert('Team added successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the entire tournament? This cannot be undone!')) {
      return;
    }

    try {
      await api.resetTournament();
      setTeams([]);
      alert('Tournament reset successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-400 text-lg">Manage teams and tournament settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Team Form */}
        <div className="card">
          <h2 className="card-header">Add New Team</h2>

          <form onSubmit={handleAddTeam}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name..."
                className="input-field w-full"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Adding...' : 'Add Team'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Danger Zone</h2>

          <div className="mb-4">
            <p className="text-gray-400 mb-4">
              Reset the entire tournament. This will delete all teams, matches, and results.
            </p>
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-all w-full"
            >
              Reset Tournament
            </button>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="card mt-8">
        <h2 className="card-header">Registered Teams ({teams.length})</h2>

        {teams.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No teams registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-neon-blue transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">#{index + 1}</div>
                    <div className="text-lg font-bold text-neon-blue">{team.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Record</div>
                    <div className="text-sm font-semibold">
                      <span className="text-green-400">{team.totalWins}W</span>
                      {' - '}
                      <span className="text-red-400">{team.totalLosses}L</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
