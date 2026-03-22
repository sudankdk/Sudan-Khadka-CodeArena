import { useEffect, useState, useCallback } from 'react';
import { server } from '@/constants/server';
import { ApiClient } from '@/services/auth/client';

export interface TimeSeriesData {
  period: string;
  count: number;
}

export interface AdminStats {
  total_users: number;
  total_problems: number;
  active_contests: number;
  user_growth: TimeSeriesData[];
  submission_stats: TimeSeriesData[];
  contest_participation: TimeSeriesData[];
  last_updated: string;
}

const BASE_URL = server.replace(/\/$/, '');
const adminClient = new ApiClient(BASE_URL);

export const useAdminStats = (days: number = 30) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminClient.get(`/api/admin/stats?days=${days}`);
      setStats(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(message);
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch };
};
