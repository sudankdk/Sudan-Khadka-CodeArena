import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useContest,
  useContestProblems,
  useContestLeaderboard,
  useRegisterForContest,
  useUnregisterFromContest,
  useRegistrationStatus,
} from '../hooks/useContests';
import { ContestHeader } from '../components/user/ContestHeader';
import { ContestProblemsList } from '../components/user/ContestProblemsList';
import { LeaderboardTable } from '../components/user/LeaderboardTable';
import UserDashboardLayout from '@/components/UserDashboardLayout';
import useAuthStore from '@/services/auth/store/auth.store';
import { canAccessProblems } from '../utils/contestHelpers';

export const UserContestDetail = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const [activeTab, setActiveTab] = useState<'problems' | 'leaderboard'>('problems');
  
  const { user } = useAuthStore();
  const { data: contest, isLoading: contestLoading } = useContest(contestId!);
  const { data: problems = [], isLoading: problemsLoading } = useContestProblems(contestId!);
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useContestLeaderboard(contestId!);
  const { data: isRegistered = false, isLoading: registrationLoading } = useRegistrationStatus(
    contestId!,
    user?.id || ''
  );

  const registerMutation = useRegisterForContest();
  const unregisterMutation = useUnregisterFromContest();

  const handleRegister = async () => {
    if (!user) {
      alert('Please login to register');
      return;
    }

    try {
      await registerMutation.mutateAsync({ contestId: contestId!, userId: user.id });
    } catch (error) {
      console.error('Failed to register:', error);
      alert('Failed to register for contest');
    }
  };

  const handleUnregister = async () => {
    if (!user) return;

    try {
      await unregisterMutation.mutateAsync({ contestId: contestId!, userId: user.id });
    } catch (error) {
      console.error('Failed to unregister:', error);
      alert('Failed to unregister from contest');
    }
  };

  if (contestLoading || registrationLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-400 font-mono">Loading contest...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="p-8">
        <p className="text-red-500 font-mono">Contest not found</p>
      </div>
    );
  }

  return (
    <UserDashboardLayout>
    <div className="space-y-6">
      {/* Contest Header */}
      <ContestHeader
        contest={contest}
        isRegistered={isRegistered}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        isLoading={registerMutation.isPending || unregisterMutation.isPending}
      />

      {/* Tabs */}
      <div className="border-b border-[#333]">
        <div className="flex gap-6">
          {['problems', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`pb-3 px-1 font-mono font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#F7D046] border-b-2 border-[#F7D046]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'problems' && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-white">Contest Problems</h2>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Solve problems to earn points and climb the leaderboard
            </p>
          </div>
          
          {(() => {
            const accessCheck = canAccessProblems(contest, isRegistered);
            
            if (!accessCheck.canAccess) {
              return (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 text-center">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 mx-auto text-[#F7D046]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-mono font-bold text-white mb-2">
                    Problems Locked
                  </h3>
                  <p className="text-gray-400 font-mono">
                    {accessCheck.message}
                  </p>
                </div>
              );
            }
            
            return (
              <ContestProblemsList
                problems={problems}
                contestId={contestId!}
                isLoading={problemsLoading}
              />
            );
          })()}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-white">Contest Leaderboard</h2>
            <p className="text-gray-400 font-mono text-sm mt-1">
              Top performers in this contest
            </p>
          </div>
          <LeaderboardTable
            entries={leaderboard}
            isLoading={leaderboardLoading}
            type="contest"
          />
        </div>
      )}
    </div>
    </UserDashboardLayout>
  );
};
