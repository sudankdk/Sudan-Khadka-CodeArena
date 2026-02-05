import { useState } from "react";
import { Icons } from '../constants/Icons';
import { NavLink } from "react-router-dom";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // mobile open/close
  const [collapsed, setCollapsed] = useState(false); // desktop shrink/expand

  const NavItems = [
    { id: "Dashboard", path: "/admin/dashboard", icon: <Icons.Dashboard /> },
    { id: "Users", path: "/admin/users", icon: <Icons.Users /> },
    { id: "Problems", path: "/admin/problems", icon: <Icons.Problems /> },
    { id: "Contest", path: "/admin/contest", icon: <Icons.Trophy /> },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow lg:hidden"
      >
        {isOpen ? <Icons.RightSlide /> : <Icons.HamBurger />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r shadow-md transition-all duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-4 right-4 p-2 rounded-lg hover:bg-gray-100 hidden lg:block"
        >
          {collapsed ? <Icons.RightSlide size={24} /> : <Icons.HamBurger />}
        </button>

        {!collapsed && (
          <div className="h-16 flex items-center px-6 border-b text-xl font-semibold text-gray-800">
            Admin
          </div>
        )}

        <nav className="p-4 flex flex-col gap-2">
          {NavItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.id}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition
         ${
           isActive
             ? "bg-indigo-100 text-indigo-600 font-semibold"
             : "text-gray-700 hover:bg-gray-100"
         }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.id}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
};

export default AdminSidebar;
