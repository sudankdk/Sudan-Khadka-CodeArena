import UserDashboardLayout from '@/components/UserDashboardLayout';
import { useState } from "react";

const Kings = () => {
  const [activeTab, setActiveTab] = useState("GLOBAL");
  const [timeFilter, setTimeFilter] = useState("ALL TIME");

  const tabs = ["GLOBAL", "COUNTRY", "FRIENDS"];
  const timeFilters = ["ALL TIME", "THIS YEAR", "THIS MONTH", "THIS WEEK"];

  const topThree = [
    { rank: 1, name: "RADIANT_CODER", rating: 3421, country: "🇰🇷", solved: 2847, contests: 156, badge: "♛" },
    { rank: 2, name: "ALGO_KING", rating: 3398, country: "🇨🇳", solved: 2756, contests: 142, badge: "♕" },
    { rank: 3, name: "BINARY_BEAST", rating: 3356, country: "🇺🇸", solved: 2698, contests: 138, badge: "♔" },
  ];

  const leaderboard = [
    { rank: 4, name: "CODE_WARRIOR", rating: 3312, country: "🇮🇳", solved: 2634, contests: 134, change: "+2" },
    { rank: 5, name: "SYNTAX_SLAYER", rating: 3287, country: "🇯🇵", solved: 2589, contests: 128, change: "-1" },
    { rank: 6, name: "LOOP_MASTER", rating: 3245, country: "🇷🇺", solved: 2534, contests: 125, change: "+5" },
    { rank: 7, name: "STACK_OVERFLOW", rating: 3198, country: "🇧🇷", solved: 2487, contests: 119, change: "0" },
    { rank: 8, name: "RECURSIVE_MIND", rating: 3156, country: "🇩🇪", solved: 2423, contests: 115, change: "-2" },
    { rank: 9, name: "POINTER_PRO", rating: 3134, country: "🇬🇧", solved: 2398, contests: 112, change: "+1" },
    { rank: 10, name: "HASH_HERO", rating: 3098, country: "🇫🇷", solved: 2356, contests: 108, change: "+3" },
    { rank: 11, name: "GRAPH_GURU", rating: 3067, country: "🇨🇦", solved: 2312, contests: 105, change: "-1" },
    { rank: 12, name: "TREE_TRAVERSER", rating: 3045, country: "🇦🇺", solved: 2287, contests: 102, change: "0" },
    { rank: 13, name: "DP_DYNAMO", rating: 3012, country: "🇳🇱", solved: 2245, contests: 98, change: "+4" },
    { rank: 14, name: "BIT_MANIPULATOR", rating: 2987, country: "🇸🇬", solved: 2198, contests: 95, change: "-3" },
    { rank: 15, name: "GREEDY_GENIUS", rating: 2956, country: "🇰🇷", solved: 2156, contests: 92, change: "+1" },
  ];

  const yourRank = {
    rank: 1234,
    name: "YOU",
    rating: 1420,
    country: "🇳🇵",
    solved: 129,
    contests: 47,
    change: "+12",
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-[#F7D046]";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-[#CD7F32]";
    return "text-white";
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith("+")) return "text-[#4ECDC4]";
    if (change.startsWith("-")) return "text-[#E54B4B]";
    return "text-gray-600";
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE THRONE ROOM</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            KINGS<span className="text-[#F7D046] ml-2">♛</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2">"I HAD SOME MONEY, I MADE THE BEST PAINTINGS EVER. I WAS COMPLETELY RECLUSIVE." — JMB</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {/* 2nd Place */}
          <div className="border-2 border-gray-400 p-6 relative mt-8">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">{topThree[1].badge}</span>
            <div className="text-center">
              <p className="text-6xl font-bold text-gray-400 font-mono mb-2">2</p>
              <div className="w-16 h-16 mx-auto border-2 border-gray-400 flex items-center justify-center mb-3">
                <span className="text-2xl">{topThree[1].country}</span>
              </div>
              <p className="text-white font-bold tracking-wider text-sm mb-1">{topThree[1].name}</p>
              <p className="text-gray-400 text-2xl font-mono font-bold">{topThree[1].rating}</p>
              <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
                <span>{topThree[1].solved} solved</span>
                <span>{topThree[1].contests} contests</span>
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="border-2 border-[#F7D046] p-6 relative bg-[#F7D046]/5">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">{topThree[0].badge}</span>
            <div className="text-center">
              <p className="text-7xl font-bold text-[#F7D046] font-mono mb-2">1</p>
              <div className="w-20 h-20 mx-auto border-2 border-[#F7D046] flex items-center justify-center mb-3">
                <span className="text-3xl">{topThree[0].country}</span>
              </div>
              <p className="text-[#F7D046] font-bold tracking-wider mb-1">{topThree[0].name}</p>
              <p className="text-white text-3xl font-mono font-bold">{topThree[0].rating}</p>
              <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
                <span>{topThree[0].solved} solved</span>
                <span>{topThree[0].contests} contests</span>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="border-2 border-[#CD7F32] p-6 relative mt-12">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">{topThree[2].badge}</span>
            <div className="text-center">
              <p className="text-5xl font-bold text-[#CD7F32] font-mono mb-2">3</p>
              <div className="w-14 h-14 mx-auto border-2 border-[#CD7F32] flex items-center justify-center mb-3">
                <span className="text-xl">{topThree[2].country}</span>
              </div>
              <p className="text-white font-bold tracking-wider text-sm mb-1">{topThree[2].name}</p>
              <p className="text-[#CD7F32] text-xl font-mono font-bold">{topThree[2].rating}</p>
              <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
                <span>{topThree[2].solved} solved</span>
                <span>{topThree[2].contests} contests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-[#333] pb-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-[#F7D046] text-black"
                    : "text-gray-500 hover:text-white border border-[#333] hover:border-[#F7D046]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 text-[10px] font-mono tracking-widest transition-all ${
                  timeFilter === filter
                    ? "text-[#F7D046] border-b border-[#F7D046]"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Your Position */}
        <div className="border-2 border-[#4ECDC4] p-4 mb-6 bg-[#4ECDC4]/5 relative">
          <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">YOU</span>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1 text-center">
              <span className="text-white text-lg font-mono font-bold">#{yourRank.rank}</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-2xl">{yourRank.country}</span>
            </div>
            <div className="col-span-4">
              <span className="text-[#4ECDC4] font-bold tracking-wider">{yourRank.name}</span>
            </div>
            <div className="col-span-2">
              <p className="text-white text-lg font-mono font-bold">{yourRank.rating}</p>
              <p className="text-[10px] text-gray-500 tracking-widest">RATING</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-300 font-mono">{yourRank.solved}</p>
              <p className="text-[10px] text-gray-500 tracking-widest">SOLVED</p>
            </div>
            <div className="col-span-1">
              <p className="text-gray-300 font-mono">{yourRank.contests}</p>
              <p className="text-[10px] text-gray-500 tracking-widest">CONTESTS</p>
            </div>
            <div className="col-span-1 text-right">
              <span className={`font-mono font-bold ${getChangeColor(yourRank.change)}`}>
                {yourRank.change}
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="border-2 border-dashed border-[#333]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
            <div className="col-span-1">RANK</div>
            <div className="col-span-1"></div>
            <div className="col-span-4">NAME</div>
            <div className="col-span-2">RATING</div>
            <div className="col-span-2">SOLVED</div>
            <div className="col-span-1">CONTESTS</div>
            <div className="col-span-1 text-right">Δ</div>
          </div>

          {/* Rows */}
          {leaderboard.map((user, idx) => (
            <div
              key={user.rank}
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] last:border-0 hover:bg-[#F7D046]/5 transition-colors ${
                idx % 3 === 0 ? "border-l-2 border-l-[#F7D046]" : ""
              }`}
            >
              <div className="col-span-1">
                <span className={`font-mono font-bold ${getRankColor(user.rank)}`}>
                  #{user.rank}
                </span>
              </div>
              <div className="col-span-1">
                <span className="text-lg">{user.country}</span>
              </div>
              <div className="col-span-4">
                <span className="text-gray-300 font-bold tracking-wider text-sm hover:text-[#F7D046] cursor-pointer transition-colors">
                  {user.name}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-white font-mono">{user.rating}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 font-mono">{user.solved}</span>
              </div>
              <div className="col-span-1">
                <span className="text-gray-500 font-mono">{user.contests}</span>
              </div>
              <div className="col-span-1 text-right">
                <span className={`font-mono text-sm ${getChangeColor(user.change)}`}>
                  {user.change !== "0" && user.change}
                  {user.change === "0" && <span className="text-gray-700">—</span>}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-6">
          <button className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
            ← PREV
          </button>
          <button className="px-3 py-2 bg-[#F7D046] text-black text-xs font-mono">1</button>
          <button className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">2</button>
          <button className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">3</button>
          <span className="px-3 py-2 text-gray-600 text-xs font-mono">...</span>
          <button className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">100</button>
          <button className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
            NEXT →
          </button>
        </div>

        {/* Stats Footer */}
        <div className="mt-10 grid grid-cols-4 gap-4">
          <div className="border-2 border-dashed border-[#333] p-4 text-center">
            <p className="text-3xl font-bold text-[#F7D046] font-mono">156,432</p>
            <p className="text-[10px] text-gray-600 tracking-widest mt-1">TOTAL CODERS</p>
          </div>
          <div className="border-2 border-dashed border-[#333] p-4 text-center">
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">3,421</p>
            <p className="text-[10px] text-gray-600 tracking-widest mt-1">HIGHEST RATING</p>
          </div>
          <div className="border-2 border-dashed border-[#333] p-4 text-center">
            <p className="text-3xl font-bold text-white font-mono">89</p>
            <p className="text-[10px] text-gray-600 tracking-widest mt-1">COUNTRIES</p>
          </div>
          <div className="border-2 border-dashed border-[#333] p-4 text-center">
            <p className="text-3xl font-bold text-[#E54B4B] font-mono">2,847</p>
            <p className="text-[10px] text-gray-600 tracking-widest mt-1">MAX SOLVED</p>
          </div>
        </div>

        {/* Basquiat element */}
        <div className="mt-10 text-[#222] text-[8px] font-mono">
          <p>"I DON'T THINK ABOUT ART WHEN I'M WORKING.</p>
          <p>I TRY TO THINK ABOUT LIFE."</p>
          <p className="text-[#F7D046] mt-1">— SAMO© 1981</p>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Kings;
