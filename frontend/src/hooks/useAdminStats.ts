import { useEffect, useState, useCallback } from 'react';
import { server } from '@/constants/server';

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

export const useAdminStats = (days: number = 30) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/stats?days=${days}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
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
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch };
};
