import type React from "react";
import AdminSidebar from "./AdminSidebar";

const AdminDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />

      <div className="flex flex-col flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              Profile
            </button>
          </div>
        </header>

        <main className="p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
