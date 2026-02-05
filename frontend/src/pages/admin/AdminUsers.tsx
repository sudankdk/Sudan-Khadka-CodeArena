import React from "react";
import AdminDashboardLayout from '../../components/AdminDashboardLayout';
import UserTable from '@/components/table/userTable';
import { fetchUserList } from "@/services/users/api";

const AdminUsers = () => {
  const [userData, setUserDataState] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadUsers = async () => {
      const res = await fetchUserList();


      const mapped = res.data.map((user: any) => ({
        name: user.username,
        email: user.email,
      }));

      setUserDataState(mapped);
    };

    loadUsers();
  }, []);

  const userColumns = [
    { key: "name", name: "Name" },
    { key: "email", name: "Email" },
  ];

  return (
    <AdminDashboardLayout>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
        <div className="p-6 bg-white shadow rounded-lg">
          <UserTable cols={userColumns} data={userData} />
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
