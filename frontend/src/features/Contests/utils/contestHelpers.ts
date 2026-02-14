import type { IContest, IContestProblem } from '@/types/contest/contest';

// Contest Status Helpers
export type ContestStatus = 'upcoming' | 'active' | 'ended';

export const getContestStatus = (contest: IContest): ContestStatus => {
  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);

  if (now < startTime) return 'upcoming';
  if (now >= startTime && now <= endTime) return 'active';
  return 'ended';
};

export const getStatusColor = (status: ContestStatus): string => {
  switch (status) {
    case 'upcoming':
      return '#4ECDC4'; // Cyan
    case 'active':
      return '#F7D046'; // Yellow
    case 'ended':
      return '#E54B4B'; // Red
    default:
      return '#666';
  }
};

export const getStatusText = (status: ContestStatus): string => {
  switch (status) {
    case 'upcoming':
      return 'Upcoming';
    case 'active':
      return 'Live';
    case 'ended':
      return 'Ended';
    default:
      return 'Unknown';
  }
};

// Difficulty Helpers
export const difficultyColor = (difficulty: string): string => {
  if (!difficulty) return '#666';
  
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return '#4ECDC4'; // Cyan
    case 'medium':
      return '#F7D046'; // Yellow
    case 'hard':
      return '#E54B4B'; // Red
    default:
      return '#666';
  }
};

// Date/Time Formatting
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeRemaining = (endTime: string): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const getContestDuration = (contest: IContest): string => {
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  const diff = end.getTime() - start.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

// Contest Statistics
export const calculateTotalPoints = (problems: IContestProblem[]): number => {
  return problems.reduce((total, problem) => total + problem.max_points, 0);
};

export const getAverageDifficulty = (problems: IContestProblem[]): string => {
  if (problems.length === 0) return 'N/A';

  const difficultyMap: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  const total = problems.reduce((sum, p) => {
    return sum + (difficultyMap[p.problem?.difficulty?.toLowerCase() || 'medium'] || 2);
  }, 0);

  const avg = total / problems.length;
  
  if (avg < 1.5) return 'Easy';
  if (avg < 2.5) return 'Medium';
  return 'Hard';
};

// Contest Validation
export const canRegister = (contest: IContest): boolean => {
  const status = getContestStatus(contest);
  return status === 'upcoming' || status === 'active';
};

export const canSubmit = (contest: IContest): boolean => {
  const status = getContestStatus(contest);
  return status === 'active';
};

export const canViewLeaderboard = (): boolean => {
  return true; // Always visible
};

// Check if user can view/access contest problems
export const canAccessProblems = (contest: IContest, isRegistered: boolean): {
  canAccess: boolean;
  message?: string;
} => {
  const status = getContestStatus(contest);
  
  // Must be registered to access problems
  if (!isRegistered) {
    return {
      canAccess: false,
      message: 'You must register for this contest to view problems',
    };
  }
  
  // Can access during contest
  if (status === 'active') {
    return { canAccess: true };
  }
  
  // Can view after contest ends
  if (status === 'ended') {
    return { canAccess: true };
  }
  
  // Cannot access before contest starts
  if (status === 'upcoming') {
    return {
      canAccess: false,
      message: `Contest starts on ${formatDateTime(contest.start_time)}`,
    };
  }
  
  return { canAccess: false };
};

export const canFinalize = (contest: IContest): boolean => {
  const status = getContestStatus(contest);
  return status === 'ended' && contest.is_rated && !contest.is_finalized;
};

// Ranking Helpers
export const getRankDisplay = (rank: number): string => {
  if (rank === 1) return '🥇 1st';
  if (rank === 2) return '🥈 2nd';
  if (rank === 3) return '🥉 3rd';
  return `#${rank}`;
};

export const getRatingChange = (change: number): string => {
  if (change > 0) return `+${change}`;
  return `${change}`;
};

export const getRatingChangeColor = (change: number): string => {
  if (change > 0) return '#4ECDC4'; // Cyan (positive)
  if (change < 0) return '#E54B4B'; // Red (negative)
  return '#666'; // Gray (neutral)
};
