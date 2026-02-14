import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useContest,
  useContestProblems,
  useContestParticipants,
  useContestLeaderboard,
  useAddProblemToContest,
  useRemoveProblemFromContest,
  useFinalizeContest,
} from '../hooks/useContests';
import { AddProblemForm } from '../components/admin/AddProblemForm';
import { ProblemsList } from '../components/admin/ProblemsList';
import { ParticipantsTable } from '../components/admin/ParticipantsTable';
import { ContestLeaderboard } from '../components/admin/ContestLeaderboard';
import { Button } from '@/components/ui/button';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import { canFinalize, getContestStatus } from '../utils/contestHelpers';
import type { IAddProblemToContest } from '@/types/contest/contest';

export const AdminContestDetail = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const [activeTab, setActiveTab] = useState<'problems' | 'participants' | 'leaderboard'>('problems');

  const { data: contest, isLoading: contestLoading } = useContest(contestId!);
  const { data: problems = [] } = useContestProblems(contestId!);
  const { data: participants = [], isLoading: participantsLoading } = useContestParticipants(contestId!);
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useContestLeaderboard(contestId!);

  const addProblemMutation = useAddProblemToContest(contestId!);
  const removeProblemMutation = useRemoveProblemFromContest(contestId!);
  const finalizeMutation = useFinalizeContest();

  const handleAddProblem = async (problem: IAddProblemToContest) => {
    try {
      await addProblemMutation.mutateAsync(problem);
      alert('Problem added successfully!');
    } catch (error) {
      console.error('Failed to add problem:', error);
      alert('Failed to add problem');
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!confirm('Are you sure you want to remove this problem?')) return;

    try {
      await removeProblemMutation.mutateAsync(problemId);
      alert('Problem removed successfully!');
    } catch (error) {
      console.error('Failed to remove problem:', error);
      alert('Failed to remove problem');
    }
  };

  const handleFinalizeContest = async () => {
    if (!confirm('Finalize contest rankings? This will update global leaderboard.')) return;

    try {
      await finalizeMutation.mutateAsync(contestId!);
      alert('Contest finalized successfully!');
    } catch (error) {
      console.error('Failed to finalize contest:', error);
      alert('Failed to finalize contest');
    }
  };

  if (contestLoading) {
    return (
      <AdminDashboardLayout>
      <div className="p-8">
        <p className="text-gray-600">Loading contest...</p>
      </div>
      </AdminDashboardLayout>
    );
  }

  if (!contest) {
    return (
      <AdminDashboardLayout>
      <div className="p-8">
        <p className="text-red-500">Contest not found</p>
      </div>
      </AdminDashboardLayout>
    );
  }

  const status = getContestStatus(contest);

  return (
    <AdminDashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {contest.title}
          </h1>
          <p className="text-gray-600">{contest.description}</p>
        </div>
        {canFinalize(contest) && (
          <Button
            onClick={handleFinalizeContest}
            disabled={finalizeMutation.isPending}
          >
            {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize Rankings'}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Status</p>
          <p className="text-gray-800 text-lg font-bold capitalize">
            {status}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Problems</p>
          <p className="text-blue-600 text-lg font-bold">
            {problems.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Participants</p>
          <p className="text-blue-600 text-lg font-bold">
            {participants.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Rated</p>
          <p className="text-gray-800 text-lg font-bold">
            {contest.is_rated ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {['problems', 'participants', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`pb-3 px-1 font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'problems' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add Problem to Contest
            </h2>
            <AddProblemForm
              onSubmit={handleAddProblem}
              isLoading={addProblemMutation.isPending}
            />
          </div>
          <ProblemsList
            problems={problems}
            onRemove={handleRemoveProblem}
            isRemoving={removeProblemMutation.isPending}
          />
        </div>
      )}

      {activeTab === 'participants' && (
        <ParticipantsTable
          participants={participants}
          isLoading={participantsLoading}
        />
      )}

      {activeTab === 'leaderboard' && (
        <ContestLeaderboard
          entries={leaderboard}
          isLoading={leaderboardLoading}
          showRatingChange={contest.is_finalized}
        />
      )}
    </div>
    </AdminDashboardLayout>
  );
};
