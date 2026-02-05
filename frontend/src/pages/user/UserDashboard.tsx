import UserDashboardLayout from '@/components/UserDashboardLayout';
import useAuthStore from "@/services/auth/store/auth.store";
import { NavLink } from "react-router-dom";

const UserDashboard = () => {
  const user = useAuthStore((state) => state.user);

  const topics = [
    { name: "ARRAY", count: 156 },
    { name: "STRING", count: 98 },
    { name: "HASH", count: 87 },
    { name: "DP", count: 124 },
    { name: "GRAPH", count: 65 },
    { name: "TREE", count: 72 },
  ];

  const recentProblems = [
    { id: 1, name: "TWO SUM", difficulty: "EASY", status: "solved" },
    { id: 2, name: "ADD TWO NUMBERS", difficulty: "MED", status: "attempted" },
    { id: 3, name: "LONGEST SUBSTRING", difficulty: "MED", status: "solved" },
    { id: 4, name: "MEDIAN OF ARRAYS", difficulty: "HARD", status: null },
  ];

  const difficultyColor = (d: string) => {
    if (d === "EASY") return "text-[#4ECDC4]";
    if (d === "MED") return "text-[#F7D046]";
    return "text-[#E54B4B]";
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl">
        {/* Hero */}
        <div className="mb-10">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">WELCOME BACK</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            {user?.username || "CODER"}
            <span className="text-[#F7D046] ml-2">♛</span>
          </h1>
        </div>

        {/* Stats - Basquiat style boxes */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border-2 border-[#F7D046] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">©</span>
            <p className="text-3xl font-bold text-white font-mono">{user?.submissions_count || 129}</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">SOLVED</p>
          </div>
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">™</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">{user?.rating || 1420}</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">RATING</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">®</span>
            <p className="text-3xl font-bold text-white font-mono">#{user?.rank || 1234}</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">RANK</p>
          </div>
        </div>

        {/* Topics */}
        <div className="mb-10">
          <p className="text-[10px] text-gray-600 tracking-widest mb-3">STUDY SUBJECTS</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <NavLink
                key={t.name}
                to={`/problems?topic=${t.name.toLowerCase()}`}
                className="px-3 py-2 border border-[#333] hover:border-[#F7D046] text-white text-xs font-mono tracking-wider transition-colors group"
              >
                {t.name}
                <span className="text-gray-600 ml-2 group-hover:text-[#F7D046]">{t.count}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Problems */}
        <div className="border-2 border-dashed border-[#333] p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-gray-600 tracking-widest">RECENT WORK</p>
            <NavLink to="/problems" className="text-[10px] text-[#F7D046] tracking-widest hover:underline">
              VIEW ALL →
            </NavLink>
          </div>
          <div className="space-y-1">
            {recentProblems.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-[#222] last:border-0"
              >
                <div className="flex items-center gap-3">
                  {p.status === "solved" && <span className="text-[#4ECDC4] text-sm">✓</span>}
                  {p.status === "attempted" && <span className="text-[#F7D046] text-sm">○</span>}
                  {!p.status && <span className="text-[#333] text-sm">○</span>}
                  <span className="text-gray-300 text-xs font-mono tracking-wide">
                    {p.id}. {p.name}
                  </span>
                </div>
                <span className={`text-[10px] tracking-widest ${difficultyColor(p.difficulty)}`}>
                  {p.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <NavLink
            to="/problems"
            className="px-5 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors"
          >
            START GRINDING
          </NavLink>
          <NavLink
            to="/contests"
            className="px-5 py-3 border-2 border-[#E54B4B] text-[#E54B4B] text-xs font-bold tracking-widest hover:bg-[#E54B4B] hover:text-white transition-colors"
          >
            ENTER ARENA
          </NavLink>
        </div>

        {/* Basquiat signature element */}
        <div className="mt-16 text-[#222] text-[8px] font-mono">
          <p>"I DON'T THINK ABOUT ART WHEN I'M WORKING."</p>
          <p>"I TRY TO THINK ABOUT LIFE." — JMB</p>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default UserDashboard;
