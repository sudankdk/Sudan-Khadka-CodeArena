"use client";

import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

interface ChartBarMultipleProps {
  stats: AdminStats | null;
  loading: boolean;
}

const ChartBarMultiple = ({ stats, loading }: ChartBarMultipleProps) => {
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

  // Merge submission stats and contest participation by date
  const submissionMap = new Map(
    stats?.submission_stats?.map(item => [item.period, item.count]) || []
  );
  const participationMap = new Map(
    stats?.contest_participation?.map(item => [item.period, item.count]) || []
  );

  // Get all unique dates
  const allDates = new Set([
    ...(stats?.submission_stats?.map(item => item.period) || []),
    ...(stats?.contest_participation?.map(item => item.period) || [])
  ]);

  const chartData = Array.from(allDates)
    .sort()
    .map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: submissionMap.get(date) || 0,
      participants: participationMap.get(date) || 0,
    }));

  const totalSubmissions = chartData.reduce((acc, curr) => acc + curr.submissions, 0);
  const totalParticipants = chartData.reduce((acc, curr) => acc + curr.participants, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>Submissions and Contest Participation - Last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: "none",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            />
            <Legend />
            <Bar dataKey="submissions" name="Submissions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="participants" name="Contest Participants" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          Total: {totalSubmissions} submissions, {totalParticipants} contest participants
          {(totalSubmissions > 0 || totalParticipants > 0) && (
            <TrendingUp className="h-4 w-4 text-green-500" />
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Platform activity over the last 30 days
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChartBarMultiple;
