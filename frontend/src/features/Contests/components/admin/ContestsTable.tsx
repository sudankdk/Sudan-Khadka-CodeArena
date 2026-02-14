import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { IContest } from '@/types/contest/contest';
import { 
  getContestStatus, 
  getStatusColor, 
  getStatusText,
  formatDateTime,
  getContestDuration 
} from '../../utils/contestHelpers';

interface ContestsTableProps {
  contests: IContest[];
  isLoading?: boolean;
}

export const ContestsTable = ({ contests, isLoading }: ContestsTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Loading contests...</p>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No contests found</p>
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
                Contest
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rated
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contests.map((contest) => {
              const status = getContestStatus(contest);
              const statusColor = getStatusColor(status);
              const statusText = getStatusText(status);

              return (
                <tr 
                  key={contest.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-semibold">
                        {contest.title}
                      </span>
                      <span className="text-gray-500 text-sm mt-1">
                        {contest.description.substring(0, 60)}
                        {contest.description.length > 60 ? '...' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                      style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-sm">
                      {formatDateTime(contest.start_time)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-sm">
                      {getContestDuration(contest)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-sm">
                      {contest.participant_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {contest.is_rated ? (
                      <span className="text-blue-600 text-sm font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-500 text-sm">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/contests/${contest.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
