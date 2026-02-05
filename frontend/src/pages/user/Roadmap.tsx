import React, { useState } from "react";
import UserDashboardLayout from '@/components/UserDashboardLayout';

interface Topic {
  id: string;
  name: string;
  problems: number;
  completed: number;
  status: "locked" | "available" | "in-progress" | "completed";
  dependencies: string[];
  x: number;
  y: number;
}

const Roadmap = () => {
  const [activeTab, setActiveTab] = useState("NEETCODE");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const tabs = ["NEETCODE", "BLIND 75", "CUSTOM", "CREATE"];

  const neetcodeTopics: Topic[] = [
    { id: "arrays", name: "ARRAYS & HASHING", problems: 9, completed: 7, status: "in-progress", dependencies: [], x: 50, y: 5 },
    { id: "twopointers", name: "TWO POINTERS", problems: 5, completed: 5, status: "completed", dependencies: ["arrays"], x: 25, y: 15 },
    { id: "stack", name: "STACK", problems: 7, completed: 4, status: "in-progress", dependencies: ["arrays"], x: 75, y: 15 },
    { id: "sliding", name: "SLIDING WINDOW", problems: 6, completed: 0, status: "available", dependencies: ["twopointers"], x: 15, y: 28 },
    { id: "binary", name: "BINARY SEARCH", problems: 7, completed: 0, status: "available", dependencies: ["twopointers"], x: 35, y: 28 },
    { id: "linkedlist", name: "LINKED LIST", problems: 11, completed: 0, status: "locked", dependencies: ["twopointers"], x: 50, y: 28 },
    { id: "trees", name: "TREES", problems: 15, completed: 0, status: "locked", dependencies: ["stack"], x: 70, y: 28 },
    { id: "heap", name: "HEAP / PQ", problems: 7, completed: 0, status: "locked", dependencies: ["trees"], x: 85, y: 40 },
    { id: "tries", name: "TRIES", problems: 3, completed: 0, status: "locked", dependencies: ["trees"], x: 70, y: 42 },
    { id: "backtrack", name: "BACKTRACKING", problems: 9, completed: 0, status: "locked", dependencies: ["trees"], x: 55, y: 42 },
    { id: "graphs", name: "GRAPHS", problems: 13, completed: 0, status: "locked", dependencies: ["trees", "backtrack"], x: 40, y: 55 },
    { id: "dp1d", name: "1-D DP", problems: 12, completed: 0, status: "locked", dependencies: ["binary"], x: 20, y: 42 },
    { id: "dp2d", name: "2-D DP", problems: 11, completed: 0, status: "locked", dependencies: ["dp1d", "graphs"], x: 30, y: 68 },
    { id: "greedy", name: "GREEDY", problems: 8, completed: 0, status: "locked", dependencies: ["dp1d"], x: 10, y: 55 },
    { id: "intervals", name: "INTERVALS", problems: 6, completed: 0, status: "locked", dependencies: ["greedy"], x: 10, y: 70 },
    { id: "advanced", name: "ADVANCED GRAPHS", problems: 6, completed: 0, status: "locked", dependencies: ["graphs", "heap"], x: 60, y: 68 },
    { id: "math", name: "MATH & GEOMETRY", problems: 8, completed: 0, status: "locked", dependencies: ["dp2d"], x: 45, y: 82 },
    { id: "bit", name: "BIT MANIPULATION", problems: 7, completed: 0, status: "locked", dependencies: ["dp2d"], x: 25, y: 82 },
  ];

  const topicProblems: Record<string, { name: string; difficulty: string; solved: boolean }[]> = {
    arrays: [
      { name: "CONTAINS DUPLICATE", difficulty: "EASY", solved: true },
      { name: "VALID ANAGRAM", difficulty: "EASY", solved: true },
      { name: "TWO SUM", difficulty: "EASY", solved: true },
      { name: "GROUP ANAGRAMS", difficulty: "MED", solved: true },
      { name: "TOP K FREQUENT", difficulty: "MED", solved: true },
      { name: "PRODUCT OF ARRAY", difficulty: "MED", solved: true },
      { name: "VALID SUDOKU", difficulty: "MED", solved: true },
      { name: "ENCODE DECODE", difficulty: "MED", solved: false },
      { name: "LONGEST CONSECUTIVE", difficulty: "MED", solved: false },
    ],
    twopointers: [
      { name: "VALID PALINDROME", difficulty: "EASY", solved: true },
      { name: "TWO SUM II", difficulty: "MED", solved: true },
      { name: "3SUM", difficulty: "MED", solved: true },
      { name: "CONTAINER WITH WATER", difficulty: "MED", solved: true },
      { name: "TRAPPING RAIN WATER", difficulty: "HARD", solved: true },
    ],
    stack: [
      { name: "VALID PARENTHESES", difficulty: "EASY", solved: true },
      { name: "MIN STACK", difficulty: "MED", solved: true },
      { name: "REVERSE POLISH", difficulty: "MED", solved: true },
      { name: "GENERATE PARENTHESES", difficulty: "MED", solved: true },
      { name: "DAILY TEMPERATURES", difficulty: "MED", solved: false },
      { name: "CAR FLEET", difficulty: "MED", solved: false },
      { name: "LARGEST RECTANGLE", difficulty: "HARD", solved: false },
    ],
  };

  const getStatusColor = (status: Topic["status"]) => {
    if (status === "completed") return "border-[#4ECDC4] bg-[#4ECDC4]/20 text-[#4ECDC4]";
    if (status === "in-progress") return "border-[#F7D046] bg-[#F7D046]/20 text-[#F7D046]";
    if (status === "available") return "border-[#E54B4B] bg-[#E54B4B]/10 text-[#E54B4B]";
    return "border-[#333] bg-[#1a1a1a] text-gray-600";
  };

  const getDiffColor = (d: string) => {
    if (d === "EASY") return "text-[#4ECDC4]";
    if (d === "MED") return "text-[#F7D046]";
    return "text-[#E54B4B]";
  };

  const drawConnections = () => {
    const lines: React.JSX.Element[] = [];
    neetcodeTopics.forEach((topic) => {
      topic.dependencies.forEach((depId) => {
        const dep = neetcodeTopics.find((t) => t.id === depId);
        if (dep) {
          const color = topic.status === "locked" ? "#333" : topic.status === "completed" ? "#4ECDC4" : "#F7D046";
          lines.push(
            <line
              key={`${depId}-${topic.id}`}
              x1={`${dep.x}%`}
              y1={`${dep.y + 4}%`}
              x2={`${topic.x}%`}
              y2={`${topic.y}%`}
              stroke={color}
              strokeWidth="2"
              strokeDasharray={topic.status === "locked" ? "5,5" : "0"}
              opacity={topic.status === "locked" ? 0.3 : 0.6}
            />
          );
        }
      });
    });
    return lines;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE PATH</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            ROADMAP<span className="text-[#F7D046] ml-2">🗺</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2">"I WANTED TO BUILD SOMETHING THAT WOULD MAKE THE PAST JEALOUS" — JMB</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">✓</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">16</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">COMPLETED</p>
          </div>
          <div className="border-2 border-[#F7D046] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">◐</span>
            <p className="text-3xl font-bold text-[#F7D046] font-mono">2</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">IN PROGRESS</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">○</span>
            <p className="text-3xl font-bold text-white font-mono">150</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">TOTAL PROBLEMS</p>
          </div>
          <div className="border-2 border-[#333] p-4 relative">
            <span className="absolute -top-2 -right-2 text-gray-500 text-xs">%</span>
            <p className="text-3xl font-bold text-white font-mono">11%</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">PROGRESS</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-mono tracking-widest transition-all ${activeTab === tab
                ? "bg-[#F7D046] text-black"
                : "text-gray-500 hover:text-white border border-[#333] hover:border-[#F7D046]"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Roadmap Visualization */}
        {(activeTab === "NEETCODE" || activeTab === "BLIND 75") && (
          <div className="flex gap-6">
            {/* Map */}
            <div className="flex-1 border-2 border-dashed border-[#333] p-4 relative" style={{ minHeight: "600px" }}>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4 absolute top-4 left-4">
                {activeTab === "NEETCODE" ? "NEETCODE 150" : "BLIND 75"} ♛
              </p>

              {/* SVG for connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {drawConnections()}
              </svg>

              {/* Topic Nodes */}
              {neetcodeTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => topic.status !== "locked" && setSelectedTopic(topic)}
                  className={`absolute transform -translate-x-1/2 px-3 py-2 border-2 text-[10px] font-mono tracking-wider transition-all z-10 ${getStatusColor(topic.status)} ${topic.status === "locked" ? "cursor-not-allowed" : "hover:scale-105 cursor-pointer"
                    }`}
                  style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
                  disabled={topic.status === "locked"}
                >
                  <div className="flex items-center gap-2">
                    {topic.status === "completed" && <span>✓</span>}
                    {topic.status === "in-progress" && <span>◐</span>}
                    {topic.status === "locked" && <span>🔒</span>}
                    <span>{topic.name}</span>
                  </div>
                  <div className="text-[8px] mt-1 opacity-70">
                    {topic.completed}/{topic.problems}
                  </div>
                </button>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 right-4 flex gap-4 text-[8px] text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-[#4ECDC4] bg-[#4ECDC4]/20"></div>
                  <span>DONE</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-[#F7D046] bg-[#F7D046]/20"></div>
                  <span>DOING</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-[#E54B4B] bg-[#E54B4B]/10"></div>
                  <span>NEXT</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-[#333] bg-[#1a1a1a]"></div>
                  <span>LOCKED</span>
                </div>
              </div>
            </div>

            {/* Topic Details Panel */}
            <div className="w-80">
              {selectedTopic ? (
                <div className="border-2 border-[#F7D046] p-4 sticky top-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[#F7D046] font-bold tracking-wider">{selectedTopic.name}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {selectedTopic.completed}/{selectedTopic.problems} COMPLETED
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="text-gray-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-[#1a1a1a] mb-4">
                    <div
                      className="h-full bg-[#4ECDC4]"
                      style={{ width: `${(selectedTopic.completed / selectedTopic.problems) * 100}%` }}
                    />
                  </div>

                  {/* Problems List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {(topicProblems[selectedTopic.id] || []).map((prob, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-[#222] last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {prob.solved ? (
                            <span className="text-[#4ECDC4]">✓</span>
                          ) : (
                            <span className="text-gray-600">○</span>
                          )}
                          <span className={`text-xs font-mono ${prob.solved ? "text-gray-500" : "text-white"}`}>
                            {prob.name}
                          </span>
                        </div>
                        <span className={`text-[8px] tracking-widest ${getDiffColor(prob.difficulty)}`}>
                          {prob.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
                    START GRINDING →
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#333] p-6 text-center">
                  <p className="text-4xl mb-4">👆</p>
                  <p className="text-gray-500 text-xs tracking-widest">SELECT A TOPIC</p>
                  <p className="text-gray-600 text-[10px] mt-2">TO VIEW PROBLEMS</p>
                </div>
              )}

              {/* Basquiat */}
              <div className="mt-6 text-[#222] text-[8px] font-mono">
                <p>"I HAD SOME MONEY,</p>
                <p>I MADE THE BEST PAINTINGS EVER."</p>
                <p className="text-[#F7D046] mt-1">— SAMO© 1984</p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Roadmaps */}
        {activeTab === "CUSTOM" && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "MY DSA JOURNEY", problems: 45, progress: 67, author: "YOU" },
              { name: "GOOGLE PREP", problems: 80, progress: 23, author: "ALGO_KING" },
              { name: "SYSTEM DESIGN", problems: 30, progress: 10, author: "CODE_WARRIOR" },
            ].map((roadmap, idx) => (
              <div key={idx} className="border-2 border-dashed border-[#333] p-4 hover:border-[#F7D046] transition-colors cursor-pointer">
                <p className="text-white font-bold tracking-wider mb-2">{roadmap.name}</p>
                <p className="text-gray-500 text-xs mb-3">by {roadmap.author}</p>
                <div className="h-2 bg-[#1a1a1a] mb-2">
                  <div className="h-full bg-[#4ECDC4]" style={{ width: `${roadmap.progress}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>{roadmap.problems} PROBLEMS</span>
                  <span>{roadmap.progress}% DONE</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Roadmap */}
        {activeTab === "CREATE" && (
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-[#F7D046] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#F7D046] text-xs tracking-widest">CREATE ROADMAP</span>

              <div className="space-y-6 mt-4">
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">ROADMAP NAME</label>
                  <input
                    type="text"
                    placeholder="MY CUSTOM PATH"
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono tracking-wider placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    placeholder="WHAT'S THIS ROADMAP FOR?"
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono tracking-wider placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">ADD TOPICS</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["ARRAY", "STRING", "DP", "GRAPH", "TREE", "BINARY SEARCH", "HEAP", "STACK"].map((topic) => (
                      <button
                        key={topic}
                        className="px-3 py-2 border border-[#333] text-gray-500 text-[10px] tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors"
                      >
                        + {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">VISIBILITY</label>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 border-2 border-[#F7D046] text-[#F7D046] text-xs tracking-widest bg-[#F7D046]/5">
                      PRIVATE
                    </button>
                    <button className="flex-1 py-3 border-2 border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#4ECDC4]">
                      PUBLIC
                    </button>
                  </div>
                </div>

                <button className="w-full py-4 bg-[#F7D046] text-black text-sm font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
                  CREATE ROADMAP ♛
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default Roadmap;
