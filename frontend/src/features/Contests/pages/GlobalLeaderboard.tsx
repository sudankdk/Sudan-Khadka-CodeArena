import { useState } from 'react';
import { useGlobalLeaderboard } from '../hooks/useContests';
import { LeaderboardTable } from '../components/user/LeaderboardTable';
import UserDashboardLayout from '@/components/UserDashboardLayout';

export const GlobalLeaderboard = () => {
  const [limit, setLimit] = useState(100);
  const { data: leaderboard = [], isLoading } = useGlobalLeaderboard(limit);

  return (
    <UserDashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-mono font-bold text-white mb-2">
          Global Leaderboard
        </h1>
        <p className="text-gray-400 font-mono">
          Top competitive programmers ranked by their contest performance
        </p>
      </div>

      {/* Stats Cards */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#FFD70020] to-[#1a1a1a] rounded-lg p-6 border border-[#FFD700] border-opacity-30">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🥇</span>
              <div>
                <p className="text-gray-400 font-mono text-sm mb-1">Top Performer</p>
                <p className="text-white font-mono text-xl font-bold">
                  {leaderboard[0]?.username}
                </p>
                <p className="text-[#F7D046] font-mono text-lg">
                  Rating: {leaderboard[0]?.rating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#C0C0C020] to-[#1a1a1a] rounded-lg p-6 border border-[#C0C0C0] border-opacity-30">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🥈</span>
              <div>
                <p className="text-gray-400 font-mono text-sm mb-1">Runner Up</p>
                <p className="text-white font-mono text-xl font-bold">
                  {leaderboard[1]?.username}
                </p>
                <p className="text-[#F7D046] font-mono text-lg">
                  Rating: {leaderboard[1]?.rating}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#CD7F3220] to-[#1a1a1a] rounded-lg p-6 border border-[#CD7F32] border-opacity-30">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🥉</span>
              <div>
                <p className="text-gray-400 font-mono text-sm mb-1">Third Place</p>
                <p className="text-white font-mono text-xl font-bold">
                  {leaderboard[2]?.username}
                </p>
                <p className="text-[#F7D046] font-mono text-lg">
                  Rating: {leaderboard[2]?.rating}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limit Selector */}
      <div className="flex items-center justify-between bg-[#1a1a1a] rounded-lg border border-[#333] p-4">
        <span className="text-gray-400 font-mono">Show top:</span>
        <div className="flex gap-2">
          {[50, 100, 200, 500].map((value) => (
            <button
              key={value}
              onClick={() => setLimit(value)}
              className={`px-4 py-2 rounded font-mono font-semibold transition-colors ${
                limit === value
                  ? 'bg-[#F7D046] text-black'
                  : 'bg-[#0f0f0f] text-gray-400 hover:text-white border border-[#333]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable
        entries={leaderboard}
        isLoading={isLoading}
        type="global"
      />

      {/* Empty State */}
      {!isLoading && leaderboard.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-12 text-center">
          <p className="text-gray-400 font-mono text-lg mb-2">
            No leaderboard data yet
          </p>
          <p className="text-gray-500 font-mono text-sm">
            Complete rated contests to appear on the global leaderboard
          </p>
        </div>
      )}
    </div>
    </UserDashboardLayout>
  );
};
