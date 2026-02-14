import { useState } from 'react';
import { useContests } from '../hooks/useContests';
import { ContestCard } from '../components/user/ContestCard';
import UserDashboardLayout from '@/components/UserDashboardLayout';
import type { IContestFilters } from '@/types/contest/contest';
import { Button } from '@/components/ui/button';

export const UserContests = () => {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all');
  const [filters, setFilters] = useState<IContestFilters>({});

  const { data: contestsData, isLoading } = useContests(page, 9, filters);

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter);
    setPage(1);
    
    if (filter === 'all') {
      setFilters({});
    } else if (filter === 'active') {
      setFilters({ is_active: true });
    } else {
      // For upcoming/ended, we'll handle client-side filtering
      setFilters({});
    }
  };

  const filteredContests = contestsData?.contests || [];

  return (
    <UserDashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-mono font-bold text-white mb-2">
          Contests
        </h1>
        <p className="text-gray-400 font-mono">
          Participate in coding contests and climb the leaderboard
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(['all', 'upcoming', 'active', 'ended'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-6 py-2 rounded-lg font-mono font-semibold capitalize transition-all whitespace-nowrap ${
              activeFilter === filter
                ? 'bg-[#F7D046] text-black'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-4">
        <input
          type="text"
          placeholder="Search contests..."
          value={filters.search || ''}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setPage(1);
          }}
          className="w-full bg-[#0f0f0f] border border-[#333] rounded px-4 py-2 text-white font-mono focus:outline-none focus:border-[#F7D046]"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-400 font-mono">Loading contests...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredContests.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-12 text-center">
          <p className="text-gray-400 font-mono text-lg mb-2">No contests found</p>
          <p className="text-gray-500 font-mono text-sm">
            Check back later for upcoming contests
          </p>
        </div>
      )}

      {/* Contests Grid */}
      {!isLoading && filteredContests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {contestsData && contestsData.total > 9 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            variant="outline"
            className="bg-transparent border-[#333] text-white hover:bg-[#222] font-mono"
          >
            Previous
          </Button>
          <span className="text-gray-400 font-mono">
            Page {page} of {Math.ceil(contestsData.total / 9)}
          </span>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(contestsData.total / 9)}
            variant="outline"
            className="bg-transparent border-[#333] text-white hover:bg-[#222] font-mono"
          >
            Next
          </Button>
        </div>
      )}
    </div>
    </UserDashboardLayout>
  );
};
