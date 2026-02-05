import UserDashboardLayout from '@/components/UserDashboardLayout';
import { useState } from "react";
import { NavLink } from "react-router-dom";

const Arena = () => {
  const [activeTab, setActiveTab] = useState("UPCOMING");

  const tabs = ["UPCOMING", "ACTIVE", "PAST", "MY BATTLES"];

  const upcomingContests = [
    {
      id: 1,
      name: "WEEKLY CONTEST 428",
      date: "JAN 5, 2026",
      time: "8:00 AM UTC",
      duration: "1.5 HRS",
      participants: 12453,
      status: "registered",
    },
    {
      id: 2,
      name: "BIWEEKLY CONTEST 148",
      date: "JAN 11, 2026",
      time: "2:30 PM UTC",
      duration: "1.5 HRS",
      participants: 8921,
      status: null,
    },
    {
      id: 3,
      name: "NEW YEAR SPECIAL",
      date: "JAN 15, 2026",
      time: "10:00 AM UTC",
      duration: "2 HRS",
      participants: 15678,
      status: null,
      special: true,
    },
  ];

  const activeContests = [
    {
      id: 4,
      name: "MIDNIGHT GRIND #42",
      timeLeft: "01:24:33",
      participants: 3421,
      problems: 4,
      solved: 2,
    },
  ];

  const pastContests = [
    {
      id: 5,
      name: "WEEKLY CONTEST 427",
      date: "DEC 29, 2025",
      rank: 234,
      totalParticipants: 11234,
      solved: "3/4",
      rating: "+23",
    },
    {
      id: 6,
      name: "BIWEEKLY CONTEST 147",
      date: "DEC 21, 2025",
      rank: 567,
      totalParticipants: 9876,
      solved: "2/4",
      rating: "-12",
    },
    {
      id: 7,
      name: "WEEKLY CONTEST 426",
      date: "DEC 15, 2025",
      rank: 189,
      totalParticipants: 10543,
      solved: "4/4",
      rating: "+45",
    },
  ];

  const leaderboard = [
    { rank: 1, name: "RADIANT_CODER", rating: 3421, country: "🇰🇷" },
    { rank: 2, name: "ALGO_KING", rating: 3398, country: "🇨🇳" },
    { rank: 3, name: "BINARY_BEAST", rating: 3356, country: "🇺🇸" },
    { rank: 4, name: "CODE_WARRIOR", rating: 3312, country: "🇮🇳" },
    { rank: 5, name: "SYNTAX_SLAYER", rating: 3287, country: "🇯🇵" },
  ];

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE BATTLEFIELD</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            ARENA<span className="text-[#E54B4B] ml-2">⚔</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2">"I DON'T LISTEN TO WHAT ART CRITICS SAY. I DON'T KNOW ANYBODY WHO NEEDS A CRITIC TO FIND OUT WHAT ART IS." — JMB</p>
        </div>

        {/* Your Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-[#F7D046] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">♛</span>
            <p className="text-3xl font-bold text-white font-mono">1,420</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">CONTEST RATING</p>
          </div>
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">©</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">47</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">CONTESTS JOINED</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">™</span>
            <p className="text-3xl font-bold text-white font-mono">#89</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">BEST RANK</p>
          </div>
          <div className="border-2 border-[#333] p-4 relative">
            <span className="absolute -top-2 -right-2 text-gray-500 text-xs">®</span>
            <p className="text-3xl font-bold text-[#F7D046] font-mono">+156</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">TOTAL GAIN</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-mono tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#E54B4B] text-white"
                  : "text-gray-500 hover:text-white border border-[#333] hover:border-[#E54B4B]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Active Contest Banner */}
            {activeTab === "ACTIVE" && activeContests.length > 0 && (
              <div className="mb-6">
                {activeContests.map((c) => (
                  <div key={c.id} className="border-2 border-[#E54B4B] p-6 relative bg-[#E54B4B]/5">
                    <div className="absolute top-0 right-0 bg-[#E54B4B] px-3 py-1">
                      <span className="text-white text-xs font-mono tracking-widest animate-pulse">● LIVE</span>
                    </div>
                    <h3 className="text-xl text-white font-bold tracking-wider mb-4">{c.name}</h3>
                    <div className="flex gap-8 mb-4">
                      <div>
                        <p className="text-4xl font-bold text-[#E54B4B] font-mono">{c.timeLeft}</p>
                        <p className="text-[10px] text-gray-500 tracking-widest">TIME LEFT</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white font-mono">{c.solved}/{c.problems}</p>
                        <p className="text-[10px] text-gray-500 tracking-widest">SOLVED</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-400 font-mono">{c.participants.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 tracking-widest">FIGHTING</p>
                      </div>
                    </div>
                    <NavLink
                      to={`/contest/${c.id}`}
                      className="inline-block px-6 py-3 bg-[#E54B4B] text-white text-xs font-bold tracking-widest hover:bg-[#c43e3e] transition-colors"
                    >
                      CONTINUE BATTLE →
                    </NavLink>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming Contests */}
            {activeTab === "UPCOMING" && (
              <div className="space-y-4">
                {upcomingContests.map((c) => (
                  <div
                    key={c.id}
                    className={`border-2 ${c.special ? "border-[#F7D046]" : "border-dashed border-[#333]"} p-4 relative hover:border-[#E54B4B] transition-colors group`}
                  >
                    {c.special && (
                      <span className="absolute -top-3 left-4 bg-[#F7D046] text-black text-[10px] font-bold px-2 py-1 tracking-widest">
                        ★ SPECIAL
                      </span>
                    )}
                    {c.status === "registered" && (
                      <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">✓</span>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold tracking-wider mb-2 group-hover:text-[#E54B4B] transition-colors">
                          {c.name}
                        </h3>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px] text-gray-600 tracking-widest">DATE</p>
                            <p className="text-sm text-gray-300 font-mono">{c.date}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600 tracking-widest">TIME</p>
                            <p className="text-sm text-gray-300 font-mono">{c.time}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600 tracking-widest">DURATION</p>
                            <p className="text-sm text-gray-300 font-mono">{c.duration}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600 tracking-widest">WARRIORS</p>
                            <p className="text-sm text-[#F7D046] font-mono">{c.participants.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        className={`px-5 py-2 text-xs font-bold tracking-widest transition-colors ${
                          c.status === "registered"
                            ? "border-2 border-[#4ECDC4] text-[#4ECDC4]"
                            : "bg-[#E54B4B] text-white hover:bg-[#c43e3e]"
                        }`}
                      >
                        {c.status === "registered" ? "REGISTERED ✓" : "REGISTER"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past Contests */}
            {activeTab === "PAST" && (
              <div className="border-2 border-dashed border-[#333]">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
                  <div className="col-span-4">CONTEST</div>
                  <div className="col-span-2">DATE</div>
                  <div className="col-span-2">RANK</div>
                  <div className="col-span-2">SOLVED</div>
                  <div className="col-span-2">RATING</div>
                </div>
                {pastContests.map((c) => (
                  <NavLink
                    key={c.id}
                    to={`/contest/${c.id}/results`}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] last:border-0 hover:bg-[#E54B4B]/5 transition-colors"
                  >
                    <div className="col-span-4 text-gray-300 text-xs font-mono tracking-wide">{c.name}</div>
                    <div className="col-span-2 text-gray-500 text-xs font-mono">{c.date}</div>
                    <div className="col-span-2 text-white text-xs font-mono">
                      #{c.rank} <span className="text-gray-600">/ {c.totalParticipants.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 text-gray-300 text-xs font-mono">{c.solved}</div>
                    <div className={`col-span-2 text-xs font-mono font-bold ${c.rating.startsWith("+") ? "text-[#4ECDC4]" : "text-[#E54B4B]"}`}>
                      {c.rating}
                    </div>
                  </NavLink>
                ))}
              </div>
            )}

            {activeTab === "MY BATTLES" && (
              <div className="text-center py-16 border-2 border-dashed border-[#333]">
                <p className="text-6xl mb-4">⚔</p>
                <p className="text-gray-500 text-xs tracking-widest">YOUR BATTLE HISTORY AWAITS</p>
                <p className="text-gray-600 text-[10px] tracking-widest mt-2">JOIN A CONTEST TO BEGIN YOUR LEGEND</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64">
            {/* Leaderboard Preview */}
            <div className="border-2 border-[#F7D046] p-4 mb-6">
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">TOP KINGS ♛</p>
              <div className="space-y-3">
                {leaderboard.map((u) => (
                  <div key={u.rank} className="flex items-center gap-3">
                    <span className={`text-sm font-bold font-mono ${u.rank === 1 ? "text-[#F7D046]" : u.rank === 2 ? "text-gray-400" : u.rank === 3 ? "text-[#CD7F32]" : "text-gray-600"}`}>
                      #{u.rank}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-xs font-mono">{u.name}</p>
                      <p className="text-[#4ECDC4] text-[10px] font-mono">{u.rating}</p>
                    </div>
                    <span>{u.country}</span>
                  </div>
                ))}
              </div>
              <NavLink
                to="/leaderboard"
                className="block mt-4 text-center text-[10px] text-[#F7D046] tracking-widest hover:underline"
              >
                VIEW ALL KINGS →
              </NavLink>
            </div>

            {/* Rating Graph Placeholder */}
            <div className="border-2 border-dashed border-[#333] p-4">
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">YOUR JOURNEY</p>
              <div className="h-32 flex items-end justify-around gap-1">
                {[65, 72, 68, 80, 75, 88, 82, 95, 90, 98].map((h, i) => (
                  <div
                    key={i}
                    className="w-3 bg-gradient-to-t from-[#E54B4B] to-[#F7D046]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[8px] text-gray-600 font-mono">OCT</span>
                <span className="text-[8px] text-gray-600 font-mono">NOW</span>
              </div>
            </div>

            {/* Basquiat element */}
            <div className="mt-6 text-[#222] text-[8px] font-mono">
              <p>"BELIEVE IT OR NOT,</p>
              <p>I CAN ACTUALLY DRAW."</p>
              <p className="text-[#E54B4B] mt-1">— JMB, 1983</p>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Arena;
