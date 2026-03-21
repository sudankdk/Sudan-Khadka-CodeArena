"use client";

import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStats } from "@/hooks/useAdminStats";

interface ChartAreaGradientProps {
  stats: AdminStats | null;
  loading: boolean;
}

const ChartAreaGradient = ({ stats, loading }: ChartAreaGradientProps) => {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = stats?.user_growth?.map((item) => ({
    date: new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.count,
  })) || [];

  const totalGrowth = chartData.reduce((acc, curr) => acc + curr.users, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Registration Growth</CardTitle>
        <CardDescription>
          Daily new user registrations over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: "none",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            />
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="users"
              type="monotone"
              stroke="#4f46e5"
              fill="url(#fillUsers)"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium">
              Total new users: {totalGrowth}
              {totalGrowth > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
            </div>
            <div className="text-muted-foreground flex items-center gap-2">
              Last 30 days
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChartAreaGradient;
