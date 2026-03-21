import { useState } from "react";
import { Icons } from '../constants/Icons';
import { NavLink } from "react-router-dom";

const UserSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const NavItems = [
    { id: "HOME", path: "/dashboard", icon: <Icons.Dashboard /> },
    { id: "PROBLEMS", path: "/problems", icon: <Icons.Problems /> },
    { id: "ARENA", path: "/contests", icon: <Icons.Trophy /> },
    { id: "1VS1", path: "/duel", icon: <Icons.Code /> },
    { id: "ROADMAP", path: "/roadmap", icon: <Icons.Clock /> },
    { id: "DISCUSS", path: "/discussion", icon: <Icons.Bell /> },
    { id: "KINGS", path: "/leaderboard", icon: <Icons.Leaderboard /> },
    { id: "PROFILE", path: "/profile", icon: <Icons.User /> },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-4 z-50 p-2 bg-[#0d0d0d] border border-[#F7D046] text-[#F7D046] lg:hidden"
      >
        {isOpen ? <Icons.RightSlide /> : <Icons.HamBurger />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-52 bg-[#0d0d0d] border-r-2 border-dashed border-[#333] transition-all duration-300 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="h-14 flex items-center px-4 border-b-2 border-dashed border-[#333]">
          <div className="flex items-center gap-2">
            <span className="text-[#F7D046] text-lg">♛</span>
            <span className="text-white font-bold tracking-wider">CODE<span className="text-[#E54B4B]">ARENA</span></span>
          </div>
        </div>

        <nav className="py-4">
          {NavItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.id}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-xs tracking-widest font-mono transition-all
                ${isActive
                  ? "text-[#F7D046] border-l-4 border-[#F7D046] bg-[#F7D046]/5"
                  : "text-gray-500 hover:text-white border-l-4 border-transparent"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.id}</span>
            </NavLink>
          ))}
        </nav>

        {/* Basquiat-style decorative element */}
        <div className="absolute bottom-8 left-4 right-4">
          <div className="text-[#333] text-[10px] font-mono leading-tight">
            <p>© SAMO</p>
            <p className="text-[#E54B4B]">1960-1988</p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 z-30 lg:hidden"
        />
      )}
    </>
  );
};

export default UserSidebar;
