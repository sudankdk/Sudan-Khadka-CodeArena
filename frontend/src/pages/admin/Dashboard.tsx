
import AdminDashboardLayout from '../../components/AdminDashboardLayout';
import StatsCard from '../../components/cards/StatsCard';
import ChartAreaGradient from '@/components/charts/AdminAreaChart';
import ChartBarMultiple from '@/components/charts/AdminBarChart';

const Dashboard = () => {
  return (
    <AdminDashboardLayout>
      <div className="flex flex-col gap-4 md:grid-cols-2">
        <StatsCard />
        <ChartAreaGradient />
        <ChartBarMultiple />
      </div>
    </AdminDashboardLayout>
  );
};

export default Dashboard;
