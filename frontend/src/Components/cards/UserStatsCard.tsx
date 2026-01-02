import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatItem {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

interface UserStatsCardProps {
  stats: StatItem[];
  className?: string;
}

const UserStatsCard = ({ stats, className }: UserStatsCardProps) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              {stat.icon}
            </div>
            {stat.trend && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.trendUp
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                )}
              >
                {stat.trend}
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCard;
