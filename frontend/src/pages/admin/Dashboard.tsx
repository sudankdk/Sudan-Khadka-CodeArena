import React from "react";
import AdminDashboardLayout from "../../Components/AdminDashboardLayout";
import StatsCard from "../../Components/cards/StatsCard";

const Dashboard = () => {
  return (
    <AdminDashboardLayout>
      <div className="">
        <StatsCard />
      </div>
    </AdminDashboardLayout>
  );
};

export default Dashboard;
