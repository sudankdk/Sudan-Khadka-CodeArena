"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
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

// Sample chart data
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const ChartBarMultiple = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bar Chart - Multiple</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />{" "}
            {/* Tailwind gray-200 */}
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: "none",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="desktop" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="mobile" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          Trending up by 5.2% this month{" "}
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChartBarMultiple;
