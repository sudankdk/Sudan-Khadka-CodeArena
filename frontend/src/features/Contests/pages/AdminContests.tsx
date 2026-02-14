import { useState } from 'react';
import { useContests, useCreateContest } from '../hooks/useContests';
import { ContestForm } from '../components/admin/ContestForm';
import { ContestsTable } from '../components/admin/ContestsTable';
import { Button } from '@/components/ui/button';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import type { ICreateContest, IContestFilters } from '@/types/contest/contest';

export const AdminContests = () => {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<IContestFilters>({});

  const { data: contestsData, isLoading } = useContests(page, 10, filters);
  const createMutation = useCreateContest();

  const handleCreateContest = async (contest: ICreateContest) => {
    try {
      await createMutation.mutateAsync(contest);
      setShowForm(false);
      // Show success notification
      alert('Contest created successfully!');
    } catch (error) {
      console.error('Failed to create contest:', error);
      alert('Failed to create contest');
    }
  };

  return (
    <AdminDashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Manage Contests
          </h1>
          <p className="text-gray-600">
            Create and manage coding contests
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Contest'}
        </Button>
      </div>

      {/* Create Contest Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Create New Contest
          </h2>
          <ContestForm
            onSubmit={handleCreateContest}
            isLoading={createMutation.isPending}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search contests..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.is_active?.toString() || ''}
            onChange={(e) => 
              setFilters({ 
                ...filters, 
                is_active: e.target.value ? e.target.value === 'true' : undefined 
              })
            }
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Contests Table */}
      <ContestsTable 
        contests={contestsData?.contests || []} 
        isLoading={isLoading} 
      />

      {/* Pagination */}
      {contestsData && contestsData.total > 10 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-gray-600">
            Page {page} of {Math.ceil(contestsData.total / 10)}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(contestsData.total / 10)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
    </AdminDashboardLayout>
  );
};
