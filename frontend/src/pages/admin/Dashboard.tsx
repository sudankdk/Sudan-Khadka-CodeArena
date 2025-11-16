import React from "react";
import AdminDashboardLayout from "../../Components/AdminDashboardLayout";

const Dashboard = () => {
  return (
    <AdminDashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow rounded-lg">Card 1</div>
        <div className="p-6 bg-white shadow rounded-lg">Card 2</div>
        <div className="p-6 bg-white shadow rounded-lg">Card 3</div>
      </div>
    </AdminDashboardLayout>
  );
};

export default Dashboard;
