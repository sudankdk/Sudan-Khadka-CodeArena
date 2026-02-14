import type { IContestLeaderboardEntry } from '@/types/contest/contest';
import { getRankDisplay, getRatingChange, getRatingChangeColor } from '../../utils/contestHelpers';

interface ContestLeaderboardProps {
  entries: IContestLeaderboardEntry[];
  isLoading?: boolean;
  showRatingChange?: boolean;
}

export const ContestLeaderboard = ({ 
  entries, 
  isLoading,
  showRatingChange = false 
}: ContestLeaderboardProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Leaderboard is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Problems
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Penalty
              </th>
              {showRatingChange && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rating Change
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => {
              const isTopThree = entry.rank <= 3;
              const rankBgColor = 
                entry.rank === 1 ? '#FEF3C7' :
                entry.rank === 2 ? '#F3F4F6' :
                entry.rank === 3 ? '#FED7AA' :
                'transparent';

              return (
                <tr 
                  key={entry.user_id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: rankBgColor }}
                >
                  <td className="px-6 py-4">
                    <span 
                      className={`font-bold text-lg ${
                        isTopThree ? 'text-2xl text-gray-900' : 'text-gray-900'
                      }`}
                    >
                      {getRankDisplay(entry.rank)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-semibold">
                      {entry.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-blue-600 font-bold text-lg">
                      {entry.score}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-semibold">
                      {entry.problems_solved}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">
                      {entry.penalty_minutes} min
                    </span>
                  </td>
                  {showRatingChange && entry.rating_change !== undefined && (
                    <td className="px-6 py-4">
                      <span
                        className="font-bold"
                        style={{ color: getRatingChangeColor(entry.rating_change) }}
                      >
                        {getRatingChange(entry.rating_change)}
                      </span>
                    </td>
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
