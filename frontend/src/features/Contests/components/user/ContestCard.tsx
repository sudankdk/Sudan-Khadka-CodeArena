import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { IContest } from '@/types/contest/contest';
import {
  getContestStatus,
  getStatusColor,
  getStatusText,
  formatDateTime,
  getTimeRemaining,
  getContestDuration,
} from '../../utils/contestHelpers';

interface ContestCardProps {
  contest: IContest;
}

export const ContestCard = ({ contest }: ContestCardProps) => {
  const status = getContestStatus(contest);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#333] hover:border-[#F7D046] transition-all p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-mono font-bold text-white mb-2">
            {contest.title}
          </h3>
          <p className="text-gray-400 font-mono text-sm line-clamp-2">
            {contest.description}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-mono font-bold ml-4"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {statusText}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-gray-400">Start:</span>
          <span className="text-white">{formatDateTime(contest.start_time)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-gray-400">Duration:</span>
          <span className="text-white">{getContestDuration(contest)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-gray-400">Participants:</span>
          <span className="text-[#4ECDC4]">{contest.participant_count || 0}</span>
        </div>
        {status === 'active' && (
          <div className="flex items-center justify-between text-sm font-mono">
            <span className="text-gray-400">Time Remaining:</span>
            <span className="text-[#E54B4B] font-bold">
              {getTimeRemaining(contest.end_time)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link to={`/contests/${contest.id}`} className="flex-1">
          <Button className="w-full bg-[#F7D046] text-black font-mono font-bold hover:bg-[#e5c040] transition-colors">
            {status === 'active' ? 'Enter Contest' : 'View Details'}
          </Button>
        </Link>
        {contest.is_rated && (
          <div className="px-3 py-2 bg-[#4ECDC4]/10 rounded border-2 border-[#4ECDC4]">
            <span className="text-[#4ECDC4] font-mono text-xs font-bold">
              RATED
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
