import { Icons } from '../../constants/Icons';
import type { AdminStats } from '@/hooks/useAdminStats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  stats: AdminStats | null;
  loading: boolean;
}

const StatsCard = ({ stats, loading }: StatsCardProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-4">
              <Skeleton className="h-12 w-12 rounded-full mr-4" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const data = [
    {
      type: "Total Users",
      value: stats?.total_users?.toLocaleString() || "0",
      logo: <Icons.Users />,
    },
    {
      type: "Total Problems",
      value: stats?.total_problems?.toLocaleString() || "0",
      logo: <Icons.Problems />,
    },
    {
      type: "Active Contests",
      value: stats?.active_contests?.toLocaleString() || "0",
      logo: <Icons.Trophy />,
    },
  ];

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((item) => (
            <div
              key={item.type}
              className="flex items-center p-4 border rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] hover:border-indigo-400"
            >
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
                {item.logo}
              </div>

              <div>
                <h3 className="text-2xl font-bold">{item.value}</h3>
                <p className="text-sm text-gray-500">{item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
