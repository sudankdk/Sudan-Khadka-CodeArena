import UserDashboardLayout from '@/components/UserDashboardLayout';
import useAuthStore from "@/services/auth/store/auth.store";
import { useState } from "react";
import { useUserStats, useSubmissions } from "@/hooks/useSubmissions";
import { NavLink } from 'react-router-dom';

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const { data: submissionsData, isLoading: submissionsLoading } = useSubmissions(1, 20, { user_id: user?.id });

  const tabs = ["OVERVIEW", "SUBMISSIONS", "BADGES", "SETTINGS"];

  const badges = [
    { id: 1, name: "FIRST BLOOD", icon: "🩸", desc: "SOLVE YOUR FIRST PROBLEM", earned: (userStats?.total_solved || 0) > 0 },
    { id: 2, name: "STREAK KING", icon: "🔥", desc: "7 DAY SOLVING STREAK", earned: false },
    { id: 3, name: "NIGHT OWL", icon: "🦉", desc: "SOLVE AT MIDNIGHT", earned: false },
    { id: 4, name: "SPEED DEMON", icon: "⚡", desc: "SOLVE IN UNDER 5 MIN", earned: false },
    { id: 5, name: "PERFECTIONIST", icon: "💎", desc: "100% TEST CASES FIRST TRY", earned: false },
    { id: 6, name: "ARENA WARRIOR", icon: "⚔", desc: "TOP 100 IN CONTEST", earned: false },
    { id: 7, name: "CROWN HOLDER", icon: "♛", desc: "REACH TOP 10", earned: false },
    { id: 8, name: "SAMO", icon: "©", desc: "SOLVE 100 PROBLEMS", earned: (userStats?.total_solved || 0) >= 100 },
  ];

  const recentSubmissions = submissionsData?.data || [];

  const calculateLanguageStats = () => {
    if (!submissionsData?.data) return [];
    
    const langCount: { [key: string]: number } = {};
    let total = 0;
    
    submissionsData.data.forEach(sub => {
      if (sub.status === 'accepted') {
        langCount[sub.language] = (langCount[sub.language] || 0) + 1;
        total++;
      }
    });
    
    return Object.entries(langCount)
      .map(([lang, count]) => ({
        lang: lang.toUpperCase(),
        solved: count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.solved - a.solved);
  };

  const languageStats = calculateLanguageStats();

  const difficultyStats = [
    { level: "EASY", solved: userStats?.easy_solved || 0, total: 847, color: "#4ECDC4" },
    { level: "MEDIUM", solved: userStats?.medium_solved || 0, total: 1762, color: "#F7D046" },
    { level: "HARD", solved: userStats?.hard_solved || 0, total: 753, color: "#E54B4B" },
  ];

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
                <p className="text-2xl font-bold text-white font-mono">{userStats?.total_solved || 0}</p>
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
                <p className="text-2xl font-bold text-[#E54B4B] font-mono">{userStats?.total_submissions || 0}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">SUBMISSIONS</p>
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
                  <p className="text-[10px] text-gray-600 tracking-widest">{userStats?.total_submissions || 0} SUBMISSIONS IN 2025</p>
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500 text-xs">ACTIVITY HEATMAP</p>
                  <p className="text-gray-600 text-[10px] mt-2">COMING SOON</p>
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
                  {statsLoading || submissionsLoading ? (
                    <p className="text-gray-500 text-xs">Loading submissions...</p>
                  ) : recentSubmissions.length > 0 ? (
                    recentSubmissions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${
                            s.status === "accepted" ? "text-[#4ECDC4]" : 
                            s.status === "wrong_answer" ? "text-[#E54B4B]" : 
                            "text-[#F7D046]"
                          }`}>
                            {s.status === "accepted" ? "✓" : s.status === "wrong_answer" ? "✗" : "◐"}
                          </span>
                          <NavLink 
                            to={`/problems/${s.problem_slug}`}
                            className="text-gray-300 text-xs font-mono hover:text-[#F7D046]"
                          >
                            {s.problem_title?.toUpperCase() || "UNKNOWN"}
                          </NavLink>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-gray-600 tracking-widest">{s.language.toUpperCase()}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{s.execution_time ? `${s.execution_time}ms` : '-'}</span>
                          <span className="text-[10px] text-gray-600">{new Date(s.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-xs">No submissions yet</p>
                    </div>
                  )}
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
                  {languageStats.length > 0 ? (
                    languageStats.slice(0, 3).map((l) => (
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
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs">No languages used yet</p>
                  )}
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
            {submissionsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-xs">Loading submissions...</p>
              </div>
            ) : recentSubmissions.length > 0 ? (
              recentSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] last:border-0 hover:bg-[#F7D046]/5 transition-colors"
                >
                  <div className="col-span-1">
                    <span className={`text-sm ${
                      s.status === "accepted" ? "text-[#4ECDC4]" : 
                      s.status === "wrong_answer" ? "text-[#E54B4B]" : 
                      "text-[#F7D046]"
                    }`}>
                      {s.status === "accepted" ? "✓" : s.status === "wrong_answer" ? "✗" : "◐"}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <NavLink 
                      to={`/problems/${s.problem_slug}`}
                      className="text-gray-300 text-xs font-mono hover:text-[#F7D046]"
                    >
                      {s.problem_title?.toUpperCase() || "UNKNOWN"}
                    </NavLink>
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs font-mono">{s.language.toUpperCase()}</div>
                  <div className="col-span-2 text-gray-500 text-xs font-mono">{s.execution_time ? `${s.execution_time}ms` : '-'}</div>
                  <div className="col-span-3 text-gray-600 text-xs">{new Date(s.created_at).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-xs">No submissions yet</p>
              </div>
            )}
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
