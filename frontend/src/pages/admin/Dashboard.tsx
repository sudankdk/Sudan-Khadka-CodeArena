
import AdminDashboardLayout from '../../components/AdminDashboardLayout';
import StatsCard from '../../components/cards/StatsCard';
import ChartAreaGradient from '@/components/charts/AdminAreaChart';
import ChartBarMultiple from '@/components/charts/AdminBarChart';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { stats, loading, error, refetch } = useAdminStats(30);

  return (
    <AdminDashboardLayout>
      <div className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <StatsCard stats={stats} loading={loading} />
        <ChartAreaGradient stats={stats} loading={loading} />
        <ChartBarMultiple stats={stats} loading={loading} />
      </div>
    </AdminDashboardLayout>
  );
};

export default Dashboard;
