import UserDashboardLayout from '@/components/UserDashboardLayout';
import useAuthStore from "@/services/auth/store/auth.store";
import { useState } from "react";

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  const tabs = ["OVERVIEW", "SUBMISSIONS", "BADGES", "SETTINGS"];

  const badges = [
    { id: 1, name: "FIRST BLOOD", icon: "🩸", desc: "SOLVE YOUR FIRST PROBLEM", earned: true },
    { id: 2, name: "STREAK KING", icon: "🔥", desc: "7 DAY SOLVING STREAK", earned: true },
    { id: 3, name: "NIGHT OWL", icon: "🦉", desc: "SOLVE AT MIDNIGHT", earned: true },
    { id: 4, name: "SPEED DEMON", icon: "⚡", desc: "SOLVE IN UNDER 5 MIN", earned: false },
    { id: 5, name: "PERFECTIONIST", icon: "💎", desc: "100% TEST CASES FIRST TRY", earned: true },
    { id: 6, name: "ARENA WARRIOR", icon: "⚔", desc: "TOP 100 IN CONTEST", earned: false },
    { id: 7, name: "CROWN HOLDER", icon: "♛", desc: "REACH TOP 10", earned: false },
    { id: 8, name: "SAMO", icon: "©", desc: "SOLVE 100 PROBLEMS", earned: true },
  ];

  const recentSubmissions = [
    { id: 1, problem: "TWO SUM", status: "ACCEPTED", lang: "PYTHON", time: "2 HRS AGO", runtime: "45ms" },
    { id: 2, problem: "ADD TWO NUMBERS", status: "WRONG", lang: "PYTHON", time: "3 HRS AGO", runtime: "-" },
    { id: 3, problem: "ADD TWO NUMBERS", status: "ACCEPTED", lang: "PYTHON", time: "3 HRS AGO", runtime: "89ms" },
    { id: 4, problem: "VALID PARENTHESES", status: "ACCEPTED", lang: "GO", time: "1 DAY AGO", runtime: "12ms" },
    { id: 5, problem: "MERGE TWO LISTS", status: "TLE", lang: "PYTHON", time: "1 DAY AGO", runtime: "-" },
  ];

  const languageStats = [
    { lang: "PYTHON", solved: 89, percent: 69 },
    { lang: "GO", solved: 25, percent: 19 },
    { lang: "JAVASCRIPT", solved: 15, percent: 12 },
  ];

  const difficultyStats = [
    { level: "EASY", solved: 67, total: 847, color: "#4ECDC4" },
    { level: "MEDIUM", solved: 52, total: 1762, color: "#F7D046" },
    { level: "HARD", solved: 10, total: 753, color: "#E54B4B" },
  ];

  const activityData = [
    [0, 1, 2, 0, 3, 1, 0],
    [1, 0, 2, 3, 0, 2, 1],
    [2, 3, 0, 1, 2, 0, 3],
    [0, 2, 1, 0, 3, 2, 1],
    [1, 0, 3, 2, 1, 0, 2],
  ];

  const getActivityColor = (val: number) => {
    if (val === 0) return "bg-[#1a1a1a]";
    if (val === 1) return "bg-[#4ECDC4]/30";
    if (val === 2) return "bg-[#4ECDC4]/60";
    return "bg-[#4ECDC4]";
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-5xl">
        {/* Profile Header */}
        <div className="flex gap-8 mb-10 pb-8 border-b-2 border-dashed border-[#333]">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 border-4 border-[#F7D046] flex items-center justify-center bg-[#1a1a1a]">
              <span className="text-5xl text-[#F7D046] font-bold">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <span className="absolute -bottom-2 -right-2 text-2xl">♛</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl text-white font-bold tracking-tight">
                {user?.username?.toUpperCase() || "CODER"}
              </h1>
              <span className="px-2 py-1 bg-[#F7D046] text-black text-[10px] font-bold tracking-widest">
                PRO
              </span>
            </div>
            <p className="text-gray-500 text-xs font-mono mb-4">{user?.email || "coder@codearena.dev"}</p>
            
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-white font-mono">{user?.submissions_count || 129}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">PROBLEMS SOLVED</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#4ECDC4] font-mono">{user?.rating || 1420}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">CONTEST RATING</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F7D046] font-mono">#{user?.rank || 1234}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">GLOBAL RANK</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#E54B4B] font-mono">47</p>
                <p className="text-[10px] text-gray-500 tracking-widest">CONTESTS</p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div>
            <button className="px-4 py-2 border-2 border-[#333] text-gray-500 text-xs font-mono tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
              EDIT PROFILE
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-mono tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#F7D046] text-black"
                  : "text-gray-500 hover:text-white border border-[#333] hover:border-[#F7D046]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Activity Heatmap */}
              <div className="border-2 border-dashed border-[#333] p-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] text-gray-600 tracking-widest">ACTIVITY ©</p>
                  <p className="text-[10px] text-gray-600 tracking-widest">129 SUBMISSIONS IN 2025</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 52 }).map((_, week) => (
                    <div key={week} className="flex flex-col gap-1">
                      {activityData.map((row, day) => (
                        <div
                          key={day}
                          className={`w-2 h-2 ${getActivityColor(row[week % 7])}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-3 items-center">
                  <span className="text-[8px] text-gray-600">LESS</span>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-2 h-2 ${getActivityColor(i)}`} />
                  ))}
                  <span className="text-[8px] text-gray-600">MORE</span>
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="border-2 border-dashed border-[#333] p-4">
                <p className="text-[10px] text-gray-600 tracking-widest mb-4">DIFFICULTY BREAKDOWN ™</p>
                <div className="space-y-4">
                  {difficultyStats.map((d) => (
                    <div key={d.level}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-mono tracking-widest" style={{ color: d.color }}>
                          {d.level}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {d.solved} / {d.total}
                        </span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] w-full">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(d.solved / d.total) * 100}%`,
                            backgroundColor: d.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="border-2 border-dashed border-[#333] p-4">
                <p className="text-[10px] text-gray-600 tracking-widest mb-4">RECENT WORK ®</p>
                <div className="space-y-2">
                  {recentSubmissions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${s.status === "ACCEPTED" ? "text-[#4ECDC4]" : s.status === "WRONG" ? "text-[#E54B4B]" : "text-[#F7D046]"}`}>
                          {s.status === "ACCEPTED" ? "✓" : s.status === "WRONG" ? "✗" : "◐"}
                        </span>
                        <span className="text-gray-300 text-xs font-mono">{s.problem}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-gray-600 tracking-widest">{s.lang}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{s.runtime}</span>
                        <span className="text-[10px] text-gray-600">{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Languages */}
              <div className="border-2 border-[#F7D046] p-4 relative">
                <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">♛</span>
                <p className="text-[10px] text-gray-600 tracking-widest mb-4">WEAPONS OF CHOICE</p>
                <div className="space-y-3">
                  {languageStats.map((l) => (
                    <div key={l.lang}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-white font-mono">{l.lang}</span>
                        <span className="text-xs text-[#4ECDC4] font-mono">{l.solved}</span>
                      </div>
                      <div className="h-1 bg-[#1a1a1a] w-full">
                        <div
                          className="h-full bg-[#F7D046]"
                          style={{ width: `${l.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Preview */}
              <div className="border-2 border-dashed border-[#333] p-4">
                <p className="text-[10px] text-gray-600 tracking-widest mb-4">BADGES</p>
                <div className="grid grid-cols-4 gap-2">
                  {badges.slice(0, 8).map((b) => (
                    <div
                      key={b.id}
                      className={`aspect-square flex items-center justify-center text-xl border ${
                        b.earned ? "border-[#F7D046] bg-[#F7D046]/10" : "border-[#333] opacity-30"
                      }`}
                      title={b.name}
                    >
                      {b.icon}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab("BADGES")}
                  className="w-full mt-3 py-2 text-[10px] text-gray-500 tracking-widest hover:text-[#F7D046] transition-colors"
                >
                  VIEW ALL BADGES →
                </button>
              </div>

              {/* Skills */}
              <div className="border-2 border-dashed border-[#333] p-4">
                <p className="text-[10px] text-gray-600 tracking-widest mb-4">TOP SKILLS</p>
                <div className="flex flex-wrap gap-2">
                  {["ARRAY", "HASH", "STRING", "DP", "TREE"].map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 border border-[#4ECDC4] text-[#4ECDC4] text-[10px] tracking-widest"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Basquiat quote */}
              <div className="text-[#222] text-[8px] font-mono">
                <p>"SINCE I WAS 17,</p>
                <p>I THOUGHT I MIGHT BE A STAR."</p>
                <p className="text-[#E54B4B] mt-1">— JMB</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "BADGES" && (
          <div className="grid grid-cols-4 gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`border-2 p-6 text-center transition-all ${
                  b.earned
                    ? "border-[#F7D046] bg-[#F7D046]/5"
                    : "border-[#333] opacity-50"
                }`}
              >
                <span className="text-4xl block mb-3">{b.icon}</span>
                <p className="text-white text-xs font-bold tracking-widest mb-1">{b.name}</p>
                <p className="text-gray-600 text-[10px] tracking-wide">{b.desc}</p>
                {b.earned && (
                  <span className="inline-block mt-3 px-2 py-1 bg-[#4ECDC4] text-black text-[8px] font-bold tracking-widest">
                    EARNED ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "SUBMISSIONS" && (
          <div className="border-2 border-dashed border-[#333]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
              <div className="col-span-1">STATUS</div>
              <div className="col-span-4">PROBLEM</div>
              <div className="col-span-2">LANGUAGE</div>
              <div className="col-span-2">RUNTIME</div>
              <div className="col-span-3">TIME</div>
            </div>
            {recentSubmissions.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] last:border-0 hover:bg-[#F7D046]/5 transition-colors"
              >
                <div className="col-span-1">
                  <span className={`text-sm ${s.status === "ACCEPTED" ? "text-[#4ECDC4]" : s.status === "WRONG" ? "text-[#E54B4B]" : "text-[#F7D046]"}`}>
                    {s.status === "ACCEPTED" ? "✓" : s.status === "WRONG" ? "✗" : "◐"}
                  </span>
                </div>
                <div className="col-span-4 text-gray-300 text-xs font-mono">{s.problem}</div>
                <div className="col-span-2 text-gray-500 text-xs font-mono">{s.lang}</div>
                <div className="col-span-2 text-gray-500 text-xs font-mono">{s.runtime}</div>
                <div className="col-span-3 text-gray-600 text-xs">{s.time}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "SETTINGS" && (
          <div className="max-w-xl space-y-6">
            <div className="border-2 border-dashed border-[#333] p-6">
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">PROFILE SETTINGS</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">USERNAME</label>
                  <input
                    type="text"
                    defaultValue={user?.username || "CODER"}
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-2 text-white text-xs font-mono tracking-wider focus:border-[#F7D046] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">EMAIL</label>
                  <input
                    type="email"
                    defaultValue={user?.email || "coder@codearena.dev"}
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-2 text-white text-xs font-mono tracking-wider focus:border-[#F7D046] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">BIO</label>
                  <textarea
                    rows={3}
                    placeholder="TELL YOUR STORY..."
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-2 text-white text-xs font-mono tracking-wider focus:border-[#F7D046] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-2 border-[#E54B4B] p-6">
              <p className="text-[10px] text-[#E54B4B] tracking-widest mb-4">DANGER ZONE</p>
              <button className="px-4 py-2 border-2 border-[#E54B4B] text-[#E54B4B] text-xs font-bold tracking-widest hover:bg-[#E54B4B] hover:text-white transition-colors">
                DELETE ACCOUNT
              </button>
            </div>

            <button className="px-6 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
              SAVE CHANGES
            </button>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default Profile;
