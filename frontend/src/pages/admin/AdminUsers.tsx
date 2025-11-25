import React from "react";
import AdminDashboardLayout from "../../Components/AdminDashboardLayout";
import UserTable from "@/Components/table/userTable";

const AdminUsers = () => {
  const userColumns = [
    { key: "name", name: "Name" },
    { key: "email", name: "Email" },
  ];

  const usersData = [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
  ];
  return (
    <AdminDashboardLayout>
      <div className="">
        <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
        <div className="p-6 bg-white shadow rounded-lg">
          <UserTable cols={userColumns} data={usersData} />
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
