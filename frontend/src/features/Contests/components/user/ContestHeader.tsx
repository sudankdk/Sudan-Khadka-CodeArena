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

interface ContestHeaderProps {
  contest: IContest;
  isRegistered?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
  isLoading?: boolean;
}

export const ContestHeader = ({
  contest,
  isRegistered = false,
  onRegister,
  onUnregister,
  isLoading = false,
}: ContestHeaderProps) => {
  const status = getContestStatus(contest);
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-mono font-bold text-white">
              {contest.title}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: `${statusColor}20`,
                color: statusColor,
              }}
            >
              {statusText}
            </span>
            {contest.is_rated && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#4ECDC4] bg-opacity-20 text-[#4ECDC4]">
                RATED
              </span>
            )}
          </div>
          <p className="text-gray-400 font-mono">{contest.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-[#0f0f0f] rounded p-3">
          <p className="text-gray-400 font-mono text-xs mb-1">Start Time</p>
          <p className="text-white font-mono text-sm font-semibold">
            {formatDateTime(contest.start_time)}
          </p>
        </div>
        <div className="bg-[#0f0f0f] rounded p-3">
          <p className="text-gray-400 font-mono text-xs mb-1">Duration</p>
          <p className="text-white font-mono text-sm font-semibold">
            {getContestDuration(contest)}
          </p>
        </div>
        <div className="bg-[#0f0f0f] rounded p-3">
          <p className="text-gray-400 font-mono text-xs mb-1">Participants</p>
          <p className="text-[#4ECDC4] font-mono text-sm font-semibold">
            {contest.participant_count || 0}
          </p>
        </div>
        {status === 'active' && (
          <div className="bg-[#0f0f0f] rounded p-3">
            <p className="text-gray-400 font-mono text-xs mb-1">Time Left</p>
            <p className="text-[#E54B4B] font-mono text-sm font-semibold">
              {getTimeRemaining(contest.end_time)}
            </p>
          </div>
        )}
      </div>

      {(status === 'upcoming' || status === 'active') && (
        <div className="flex items-center gap-3">
          {!isRegistered ? (
            <Button
              onClick={onRegister}
              disabled={isLoading}
              className="bg-[#F7D046] text-black font-mono font-bold hover:bg-[#e5c040] transition-colors"
            >
              {isLoading ? 'Registering...' : 'Register for Contest'}
            </Button>
          ) : (
            <Button
              onClick={onUnregister}
              disabled={isLoading}
              variant="outline"
              className="bg-transparent border-[#E54B4B] text-[#E54B4B] hover:bg-[#E54B4B] hover:text-white font-mono transition-colors"
            >
              {isLoading ? 'Unregistering...' : 'Unregister'}
            </Button>
          )}
          {isRegistered && (
            <span className="text-[#4ECDC4] font-mono text-sm">
              ✓ You are registered
            </span>
          )}
        </div>
      )}
    </div>
  );
};
