import UserDashboardLayout from "@/Components/UserDashboardLayout";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const Discussion = () => {
  const [activeTab, setActiveTab] = useState("TRENDING");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = ["TRENDING", "LATEST", "TOP", "MY POSTS", "SAVED"];

  const tags = [
    { name: "ARRAY", color: "#F7D046" },
    { name: "DP", color: "#E54B4B" },
    { name: "INTERVIEW", color: "#4ECDC4" },
    { name: "TIPS", color: "#F7D046" },
    { name: "CAREER", color: "#4ECDC4" },
    { name: "HELP", color: "#E54B4B" },
  ];

  const discussions = [
    {
      id: 1,
      title: "HOW I CRACKED FAANG IN 6 MONTHS - MY COMPLETE ROADMAP",
      author: "ALGO_KING",
      avatar: "A",
      time: "2 HRS AGO",
      views: 12453,
      replies: 234,
      likes: 1892,
      tags: ["INTERVIEW", "CAREER"],
      pinned: true,
    },
    {
      id: 2,
      title: "UNDERSTANDING SLIDING WINDOW - A VISUAL GUIDE",
      author: "CODE_WARRIOR",
      avatar: "C",
      time: "5 HRS AGO",
      views: 8921,
      replies: 156,
      likes: 1245,
      tags: ["ARRAY", "TIPS"],
      pinned: false,
    },
    {
      id: 3,
      title: "WHY DP IS NOT AS HARD AS YOU THINK",
      author: "RECURSIVE_MIND",
      avatar: "R",
      time: "8 HRS AGO",
      views: 6543,
      replies: 89,
      likes: 876,
      tags: ["DP", "TIPS"],
      pinned: false,
    },
    {
      id: 4,
      title: "NEED HELP WITH TWO SUM VARIANT - TLE ON LARGE INPUT",
      author: "NEWBIE_CODER",
      avatar: "N",
      time: "12 HRS AGO",
      views: 234,
      replies: 23,
      likes: 12,
      tags: ["HELP", "ARRAY"],
      pinned: false,
    },
    {
      id: 5,
      title: "GRAPH ALGORITHMS CHEAT SHEET - BFS, DFS, DIJKSTRA",
      author: "GRAPH_GURU",
      avatar: "G",
      time: "1 DAY AGO",
      views: 15678,
      replies: 312,
      likes: 2341,
      tags: ["TIPS"],
      pinned: false,
    },
    {
      id: 6,
      title: "MY JOURNEY FROM 0 TO 2000 RATING IN 1 YEAR",
      author: "STACK_OVERFLOW",
      avatar: "S",
      time: "1 DAY AGO",
      views: 9876,
      replies: 178,
      likes: 1567,
      tags: ["CAREER"],
      pinned: false,
    },
    {
      id: 7,
      title: "WEEKLY CONTEST 427 - POST CONTEST DISCUSSION",
      author: "RADIANT_CODER",
      avatar: "R",
      time: "2 DAYS AGO",
      views: 4532,
      replies: 287,
      likes: 456,
      tags: ["INTERVIEW"],
      pinned: false,
    },
  ];

  const topContributors = [
    { name: "ALGO_KING", posts: 234, karma: 12453 },
    { name: "GRAPH_GURU", posts: 189, karma: 9876 },
    { name: "CODE_WARRIOR", posts: 156, karma: 8234 },
    { name: "RECURSIVE_MIND", posts: 134, karma: 7654 },
    { name: "DP_DYNAMO", posts: 112, karma: 6543 },
  ];

  const getTagColor = (tag: string) => {
    const found = tags.find((t) => t.name === tag);
    return found?.color || "#F7D046";
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE FORUM</p>
            <h1 className="text-3xl text-white font-bold tracking-tight">
              DISCUSSION<span className="text-[#4ECDC4] ml-2">💬</span>
            </h1>
            <p className="text-gray-500 text-xs font-mono mt-2">"ART IS HOW WE DECORATE SPACE, MUSIC IS HOW WE DECORATE TIME" — JMB</p>
          </div>
          <button className="px-5 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
            + NEW POST
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="SEARCH DISCUSSIONS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-xs font-mono tracking-wider placeholder:text-gray-600 focus:border-[#4ECDC4] focus:outline-none transition-colors"
          />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag.name}
              className="px-3 py-1 text-[10px] tracking-widest font-mono border transition-colors hover:bg-white/5"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              #{tag.name}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[#4ECDC4] text-black"
                  : "text-gray-500 hover:text-white border border-[#333] hover:border-[#4ECDC4]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {discussions.map((post) => (
              <NavLink
                key={post.id}
                to={`/discussion/${post.id}`}
                className={`block border-2 ${post.pinned ? "border-[#F7D046]" : "border-dashed border-[#333]"} p-4 hover:border-[#4ECDC4] transition-colors group relative`}
              >
                {post.pinned && (
                  <span className="absolute -top-2 left-4 bg-[#F7D046] text-black text-[8px] font-bold px-2 py-0.5 tracking-widest">
                    📌 PINNED
                  </span>
                )}
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 border-2 border-[#4ECDC4] flex items-center justify-center text-[#4ECDC4] font-bold flex-shrink-0">
                    {post.avatar}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold tracking-wide text-sm mb-2 group-hover:text-[#4ECDC4] transition-colors truncate">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                      <span className="text-gray-400">{post.author}</span>
                      <span>•</span>
                      <span>{post.time}</span>
                      <span>•</span>
                      <span>{post.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] tracking-widest px-2 py-0.5"
                          style={{ color: getTagColor(tag), borderColor: getTagColor(tag), borderWidth: 1 }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 items-center text-xs font-mono">
                    <div className="text-center">
                      <p className="text-[#E54B4B]">♥</p>
                      <p className="text-gray-500">{post.likes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#4ECDC4]">💬</p>
                      <p className="text-gray-500">{post.replies}</p>
                    </div>
                  </div>
                </div>
              </NavLink>
            ))}

            {/* Load More */}
            <button className="w-full py-3 border-2 border-dashed border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#4ECDC4] hover:text-[#4ECDC4] transition-colors">
              LOAD MORE DISCUSSIONS →
            </button>
          </div>

          {/* Sidebar */}
          <div className="w-64 space-y-6">
            {/* Top Contributors */}
            <div className="border-2 border-[#F7D046] p-4 relative">
              <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">♛</span>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">TOP VOICES</p>
              <div className="space-y-3">
                {topContributors.map((user, idx) => (
                  <div key={user.name} className="flex items-center gap-3">
                    <span className={`text-sm font-bold font-mono ${idx === 0 ? "text-[#F7D046]" : "text-gray-600"}`}>
                      #{idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-xs font-mono">{user.name}</p>
                      <p className="text-[10px] text-gray-600">{user.posts} posts • {user.karma} karma</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="border-2 border-dashed border-[#333] p-4">
              <p className="text-[10px] text-gray-600 tracking-widest mb-3">RULES ©</p>
              <ul className="space-y-2 text-[10px] text-gray-500">
                <li>• BE RESPECTFUL</li>
                <li>• NO SPAM OR SELF-PROMO</li>
                <li>• USE PROPER TAGS</li>
                <li>• SEARCH BEFORE POSTING</li>
                <li>• SHARE KNOWLEDGE FREELY</li>
              </ul>
            </div>

            {/* Basquiat */}
            <div className="text-[#222] text-[8px] font-mono">
              <p>"I START A PICTURE AND I FINISH IT.</p>
              <p>I DON'T THINK ABOUT ART WHILE I WORK."</p>
              <p className="text-[#4ECDC4] mt-1">— SAMO© 1983</p>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Discussion;
