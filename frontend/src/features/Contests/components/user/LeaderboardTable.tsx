import type { IContestLeaderboardEntry, IGlobalLeaderboardEntry } from '@/types/contest/contest';
import { getRankDisplay } from '../../utils/contestHelpers';

interface LeaderboardTableProps {
  entries: IContestLeaderboardEntry[] | IGlobalLeaderboardEntry[];
  isLoading?: boolean;
  type?: 'contest' | 'global';
}

export const LeaderboardTable = ({ 
  entries, 
  isLoading,
  type = 'contest' 
}: LeaderboardTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
        <p className="text-gray-400 font-mono">Loading leaderboard...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
        <p className="text-gray-400 font-mono">No entries yet</p>
      </div>
    );
  }

  const isGlobalLeaderboard = type === 'global';

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                User
              </th>
              {isGlobalLeaderboard ? (
                <>
                  <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Contests
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Problems
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Penalty
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {entries.map((entry) => {
              const isTopThree = entry.rank <= 3;
              const rankBgColor = 
                entry.rank === 1 ? '#FFD70020' :
                entry.rank === 2 ? '#C0C0C020' :
                entry.rank === 3 ? '#CD7F3220' :
                'transparent';

              return (
                <tr 
                  key={entry.user_id}
                  className="hover:bg-[#222] transition-colors"
                  style={{ backgroundColor: rankBgColor }}
                >
                  <td className="px-6 py-4">
                    <span 
                      className={`font-mono font-bold ${
                        isTopThree ? 'text-2xl' : 'text-lg text-white'
                      }`}
                    >
                      {getRankDisplay(entry.rank)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-mono font-semibold">
                      {entry.username}
                    </span>
                  </td>
                  {isGlobalLeaderboard ? (
                    <>
                      <td className="px-6 py-4">
                        <span className="text-[#F7D046] font-mono font-bold text-lg">
                          {(entry as IGlobalLeaderboardEntry).rating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#4ECDC4] font-mono">
                          {(entry as IGlobalLeaderboardEntry).contests_participated}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className="text-[#F7D046] font-mono font-bold text-lg">
                          {(entry as IContestLeaderboardEntry).score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#4ECDC4] font-mono font-semibold">
                          {(entry as IContestLeaderboardEntry).problems_solved}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#E54B4B] font-mono">
                          {(entry as IContestLeaderboardEntry).penalty_minutes} min
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
