import type React from "react";
import UserSidebar from "./UserSidebar";
import { useAuth } from "@/services/auth/hook/useAuth";
import useAuthStore from "@/services/auth/store/auth.store";
import { Icons } from "@/const/Icons";

const UserDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d]">
      <UserSidebar />

      <div className="flex flex-col flex-1 ml-0 lg:ml-52 transition-all duration-300">
        <header className="h-14 bg-[#0d0d0d] border-b-2 border-dashed border-[#333] px-6 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#F7D046] flex items-center justify-center text-[#F7D046] text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm text-white font-mono">{user?.username || "User"}</span>
            </div>
            <button 
              onClick={logout}
              className="text-[#E54B4B] hover:text-white transition-colors"
            >
              <Icons.Logout className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-6 overflow-y-auto flex-1 bg-[#0d0d0d]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserDashboardLayout;
