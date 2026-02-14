import type { IContestParticipant } from '@/types/contest/contest';
import { formatDateTime } from '../../utils/contestHelpers';

interface ParticipantsTableProps {
  participants: IContestParticipant[];
  isLoading?: boolean;
}

export const ParticipantsTable = ({ participants, isLoading }: ParticipantsTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Loading participants...</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No participants yet</p>
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
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Problems Solved
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Penalty
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Registered At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr 
                key={participant.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-semibold">
                      {participant.user?.username || 'Unknown'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {participant.user?.email || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-bold text-lg">
                    {participant.total_points}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-semibold">
                    {participant.problems_solved}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700">
                    {participant.penalty_time} min
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700 text-sm">
                    {formatDateTime(participant.registered_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
