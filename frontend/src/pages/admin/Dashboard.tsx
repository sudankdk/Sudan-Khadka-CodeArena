import React from "react";
import AdminDashboardLayout from "../../Components/AdminDashboardLayout";
import StatsCard from "../../Components/cards/StatsCard";
import ChartAreaGradient from "@/Components/charts/AdminAreaChart";

const Dashboard = () => {
  return (
    <AdminDashboardLayout>
      <div className="flex flex-col gap-4 md:grid-cols-2">
        <StatsCard />
        <ChartAreaGradient />
      </div>
    </AdminDashboardLayout>
  );
};

export default Dashboard;
