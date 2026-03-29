import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import {
  createCustomRoadmap,
  deleteCustomRoadmap,
  listCustomRoadmaps,
  updateRoadmapProgress,
} from "@/services/auth/api/roadmap";
import { getProblemTests } from "@/services/auth/api/problemtest";
import type { ICustomRoadmap, IRoadmapProblem } from "@/types/roadmap/roadmap";
import type { IProblemTest } from "@/types/problemstest/problemtest";

/* ──────────────── Static NeetCode topology ──────────────── */
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

const TOPIC_OPTIONS = ["Array", "String", "Dynamic Programming", "Graph", "Tree", "Binary Search", "Heap", "Stack", "Linked List", "Greedy", "Backtracking", "Sorting", "Math", "Bit Manipulation"];

/* ──────────────── Helpers ──────────────── */
const diffColor = (d: string) => {
  const dl = d?.toLowerCase();
  if (dl === "easy") return "text-[#4ECDC4]";
  if (dl === "medium") return "text-[#F7D046]";
  return "text-[#E54B4B]";
};

const getStatusColor = (status: Topic["status"]) => {
  if (status === "completed") return "border-[#4ECDC4] bg-[#4ECDC4]/20 text-[#4ECDC4]";
  if (status === "in-progress") return "border-[#F7D046] bg-[#F7D046]/20 text-[#F7D046]";
  if (status === "available") return "border-[#E54B4B] bg-[#E54B4B]/10 text-[#E54B4B]";
  return "border-[#333] bg-[#1a1a1a] text-gray-600";
};

/* ──────────────── Component ──────────────── */
const Roadmap = () => {
  const [activeTab, setActiveTab] = useState("NEETCODE");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Custom roadmaps list
  const [customRoadmaps, setCustomRoadmaps] = useState<ICustomRoadmap[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSearch, setCustomSearch] = useState("");
  const [customVisibilityFilter, setCustomVisibilityFilter] = useState<"all" | "public" | "private">("all");
  const [customSortBy, setCustomSortBy] = useState<"progress" | "name">("progress");

  // Roadmap detail modal
  const [detailRoadmap, setDetailRoadmap] = useState<ICustomRoadmap | null>(null);
  const [progressInput, setProgressInput] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // CREATE form state
  const [roadmapName, setRoadmapName] = useState("");
  const [roadmapDescription, setRoadmapDescription] = useState("");
  const [roadmapVisibility, setRoadmapVisibility] = useState<"private" | "public">("private");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Problem search
  const [problemSearch, setProblemSearch] = useState("");
  const [problemResults, setProblemResults] = useState<IProblemTest[]>([]);
  const [problemSearchLoading, setProblemSearchLoading] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState("");

  const loadCustomRoadmaps = async () => {
    setCustomLoading(true);
    setCustomError(null);
    try {
      const data = await listCustomRoadmaps();
      setCustomRoadmaps(data);
    } catch {
      setCustomError("Failed to load custom roadmaps.");
    } finally {
      setCustomLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "CUSTOM") loadCustomRoadmaps();
  }, [activeTab]);

  // Debounced problem search
  const searchProblems = useCallback(async (query: string, diff: string) => {
    setProblemSearchLoading(true);
    try {
      const resp = await getProblemTests(1, 20, query || undefined);
      let results = resp.problems || [];
      if (diff) results = results.filter((p) => p.difficulty?.toLowerCase() === diff.toLowerCase());
      setProblemResults(results);
    } catch {
      setProblemResults([]);
    } finally {
      setProblemSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "CREATE") return;
    const timer = setTimeout(() => searchProblems(problemSearch, difficultyFilter), 400);
    return () => clearTimeout(timer);
  }, [problemSearch, difficultyFilter, activeTab, searchProblems]);

  useEffect(() => {
    if (activeTab === "CREATE") searchProblems("", "");
  }, [activeTab, searchProblems]);

  const toggleTopic = (topic: string) =>
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );

  const toggleProblem = (id: string) =>
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const handleCreateRoadmap = async () => {
    if (!roadmapName.trim()) { setCreateError("Roadmap name is required."); return; }
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      const created = await createCustomRoadmap({
        name: roadmapName.trim(),
        description: roadmapDescription.trim(),
        visibility: roadmapVisibility,
        topics: selectedTopics,
        problem_ids: selectedProblemIds,
        total_problems: selectedProblemIds.length || selectedTopics.length,
      });
      setCustomRoadmaps((prev) => [created, ...prev]);
      setRoadmapName("");
      setRoadmapDescription("");
      setRoadmapVisibility("private");
      setSelectedTopics([]);
      setSelectedProblemIds([]);
      setCreateSuccess(true);
      setTimeout(() => { setCreateSuccess(false); setActiveTab("CUSTOM"); }, 1200);
    } catch {
      setCreateError("Failed to create roadmap. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!detailRoadmap) return;
    setSavingProgress(true);
    try {
      const updated = await updateRoadmapProgress(detailRoadmap.id, { progress: progressInput });
      setCustomRoadmaps((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setDetailRoadmap(updated);
    } catch {/* ignore */} finally {
      setSavingProgress(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCustomRoadmap(id);
      setCustomRoadmaps((prev) => prev.filter((r) => r.id !== id));
      if (detailRoadmap?.id === id) setDetailRoadmap(null);
    } catch {/* ignore */} finally {
      setDeletingId(null);
    }
  };

  const openDetail = (roadmap: ICustomRoadmap) => {
    setDetailRoadmap(roadmap);
    setProgressInput(roadmap.progress);
  };

  const normalizedSearch = customSearch.trim().toLowerCase();
  const filteredRoadmaps = customRoadmaps
    .filter((roadmap) => {
      if (customVisibilityFilter === "all") return true;
      return roadmap.visibility === customVisibilityFilter;
    })
    .filter((roadmap) => {
      if (!normalizedSearch) return true;
      const name = roadmap.name?.toLowerCase() || "";
      const description = roadmap.description?.toLowerCase() || "";
      return name.includes(normalizedSearch) || description.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (customSortBy === "name") return a.name.localeCompare(b.name);
      return (b.progress || 0) - (a.progress || 0);
    });

  const customStats = customRoadmaps.reduce(
    (acc, roadmap) => {
      acc.total += 1;
      acc.publicCount += roadmap.visibility === "public" ? 1 : 0;
      acc.progressSum += roadmap.progress || 0;
      return acc;
    },
    { total: 0, publicCount: 0, progressSum: 0 }
  );
  const avgProgress = customStats.total > 0
    ? Math.round(customStats.progressSum / customStats.total)
    : 0;

  const drawConnections = () => {
    const lines: React.JSX.Element[] = [];
    neetcodeTopics.forEach((topic) => {
      topic.dependencies.forEach((depId) => {
        const dep = neetcodeTopics.find((t) => t.id === depId);
        if (dep) {
          const color = topic.status === "locked" ? "#333" : topic.status === "completed" ? "#4ECDC4" : "#F7D046";
          lines.push(
            <line key={`${depId}-${topic.id}`}
              x1={`${dep.x}%`} y1={`${dep.y + 4}%`}
              x2={`${topic.x}%`} y2={`${topic.y}%`}
              stroke={color} strokeWidth="2"
              strokeDasharray={topic.status === "locked" ? "5,5" : "0"}
              opacity={topic.status === "locked" ? 0.3 : 0.6}
            />
          );
        }
      });
    });
    return lines;
  };

  const tabs = ["NEETCODE", "BLIND 75", "CUSTOM", "CREATE"];

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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-dashed border-[#333] pb-4">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-mono tracking-widest transition-all ${activeTab === tab
                ? "bg-[#F7D046] text-black"
                : "text-gray-500 hover:text-white border border-[#333] hover:border-[#F7D046]"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── NeetCode / Blind 75 tab ── */}
        {(activeTab === "NEETCODE" || activeTab === "BLIND 75") && (
          <div className="flex gap-6">
            <div className="flex-1 border-2 border-dashed border-[#333] p-4 relative" style={{ minHeight: 600 }}>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4 absolute top-4 left-4">
                {activeTab === "NEETCODE" ? "NEETCODE 150" : "BLIND 75"} ♛
              </p>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {drawConnections()}
              </svg>
              {neetcodeTopics.map((topic) => (
                <button key={topic.id}
                  onClick={() => topic.status !== "locked" && setSelectedTopic(topic)}
                  className={`absolute transform -translate-x-1/2 px-3 py-2 border-2 text-[10px] font-mono tracking-wider transition-all z-10 ${getStatusColor(topic.status)} ${topic.status === "locked" ? "cursor-not-allowed" : "hover:scale-105 cursor-pointer"}`}
                  style={{ left: `${topic.x}%`, top: `${topic.y}%` }}
                  disabled={topic.status === "locked"}>
                  <div className="flex items-center gap-2">
                    {topic.status === "completed" && <span>✓</span>}
                    {topic.status === "in-progress" && <span>◐</span>}
                    {topic.status === "locked" && <span>🔒</span>}
                    <span>{topic.name}</span>
                  </div>
                  <div className="text-[8px] mt-1 opacity-70">{topic.completed}/{topic.problems}</div>
                </button>
              ))}
              <div className="absolute bottom-4 right-4 flex gap-4 text-[8px] text-gray-500">
                {[["#4ECDC4", "DONE"], ["#F7D046", "DOING"], ["#E54B4B", "NEXT"], ["#333", "LOCKED"]].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-3 h-3 border" style={{ borderColor: c, background: `${c}22` }} />
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-80">
              {selectedTopic ? (
                <div className="border-2 border-[#F7D046] p-4 sticky top-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[#F7D046] font-bold tracking-wider">{selectedTopic.name}</p>
                      <p className="text-gray-500 text-xs mt-1">{selectedTopic.completed}/{selectedTopic.problems} COMPLETED</p>
                    </div>
                    <button onClick={() => setSelectedTopic(null)} className="text-gray-500 hover:text-white">✕</button>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] mb-4">
                    <div className="h-full bg-[#4ECDC4]" style={{ width: `${(selectedTopic.completed / selectedTopic.problems) * 100}%` }} />
                  </div>
                  <button className="w-full mt-2 py-3 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
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
            </div>
          </div>
        )}

        {/* ── CUSTOM tab ── */}
        {activeTab === "CUSTOM" && (
          <div>
            {customLoading && <div className="border-2 border-dashed border-[#333] p-8 text-center text-gray-500 text-xs tracking-widest">LOADING...</div>}
            {customError && <div className="border-2 border-[#E54B4B] p-6 text-center text-[#E54B4B] text-xs tracking-widest">{customError}</div>}
            {!customLoading && !customError && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div className="border border-dashed border-[#333] p-4">
                    <p className="text-[10px] text-gray-500 tracking-widest">TOTAL ROADMAPS</p>
                    <p className="text-2xl text-white font-bold mt-2">{customStats.total}</p>
                  </div>
                  <div className="border border-dashed border-[#333] p-4">
                    <p className="text-[10px] text-gray-500 tracking-widest">PUBLIC ROADMAPS</p>
                    <p className="text-2xl text-white font-bold mt-2">{customStats.publicCount}</p>
                  </div>
                  <div className="border border-dashed border-[#333] p-4">
                    <p className="text-[10px] text-gray-500 tracking-widest">AVG PROGRESS</p>
                    <p className="text-2xl text-white font-bold mt-2">{avgProgress}%</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-6">
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="SEARCH ROADMAPS..."
                      value={customSearch}
                      onChange={(e) => setCustomSearch(e.target.value)}
                      className="w-full bg-transparent border-2 border-[#333] px-4 py-2.5 text-white text-sm font-mono placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      {(["all", "private", "public"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setCustomVisibilityFilter(filter)}
                          className={`px-3 py-2 text-[9px] tracking-widest border transition-colors ${customVisibilityFilter === filter
                            ? "border-[#F7D046] text-[#F7D046]"
                            : "border-[#333] text-gray-600 hover:border-[#F7D046]"}`}
                        >
                          {filter.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 tracking-widest">SORT</span>
                    <div className="flex gap-2">
                      {(["progress", "name"] as const).map((sort) => (
                        <button
                          key={sort}
                          type="button"
                          onClick={() => setCustomSortBy(sort)}
                          className={`px-3 py-2 text-[9px] tracking-widest border transition-colors ${customSortBy === sort
                            ? "border-[#4ECDC4] text-[#4ECDC4]"
                            : "border-[#333] text-gray-600 hover:border-[#4ECDC4]"}`}
                        >
                          {sort.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredRoadmaps.length === 0 ? (
                  <div className="border-2 border-dashed border-[#333] p-12 text-center">
                    <p className="text-5xl mb-4">🗺</p>
                    <p className="text-gray-500 text-xs tracking-widest mb-3">
                      {customRoadmaps.length === 0 ? "NO CUSTOM ROADMAPS YET" : "NO MATCHING ROADMAPS"}
                    </p>
                    {customRoadmaps.length > 0 && (
                      <p className="text-gray-600 text-[10px] mb-4">Try clearing filters or adjusting your search.</p>
                    )}
                    <button onClick={() => setActiveTab("CREATE")}
                      className="px-6 py-2 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
                      CREATE YOUR FIRST ROADMAP
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRoadmaps.map((roadmap) => {
                      const progress = Math.min(Math.max(roadmap.progress, 0), 100);
                      const problemCount = roadmap.total_problems || roadmap.problems?.length || 0;
                      return (
                        <div key={roadmap.id}
                          className="border-2 border-dashed border-[#333] p-4 hover:border-[#F7D046] transition-colors cursor-pointer group relative"
                          onClick={() => openDetail(roadmap)}>
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-white font-bold tracking-wider text-sm pr-6">{roadmap.name}</p>
                            <span className={`text-[8px] tracking-widest px-2 py-0.5 border shrink-0 ${roadmap.visibility === "public" ? "border-[#4ECDC4] text-[#4ECDC4]" : "border-[#555] text-gray-500"}`}>
                              {roadmap.visibility.toUpperCase()}
                            </span>
                          </div>
                          {roadmap.description && (
                            <p className="text-gray-500 text-xs mb-3 line-clamp-2">{roadmap.description}</p>
                          )}
                          <div className="h-1.5 bg-[#1a1a1a] mb-2 border border-[#333]">
                            <div className="h-full bg-[#4ECDC4] transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-3">
                            <span>{problemCount} PROBLEMS</span>
                            <span className="text-[#4ECDC4]">{progress}% DONE</span>
                          </div>
                          {roadmap.topics?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {roadmap.topics.slice(0, 3).map((t) => (
                                <span key={t} className="text-[8px] tracking-widest px-1.5 py-0.5 border border-[#333] text-gray-600">{t}</span>
                              ))}
                              {roadmap.topics.length > 3 && <span className="text-[8px] text-gray-600">+{roadmap.topics.length - 3}</span>}
                            </div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(roadmap.id); }}
                            disabled={deletingId === roadmap.id}
                            className="text-[9px] text-gray-700 hover:text-[#E54B4B] transition-colors tracking-widest">
                            {deletingId === roadmap.id ? "DELETING..." : "DELETE ✕"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── CREATE tab ── */}
        {activeTab === "CREATE" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: form */}
            <div className="border-2 border-[#F7D046] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#F7D046] text-xs tracking-widest">CREATE ROADMAP</span>
              <div className="space-y-5 mt-2">
                {/* Name */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-1.5">ROADMAP NAME *</label>
                  <input type="text" placeholder="MY CUSTOM PATH"
                    value={roadmapName} onChange={(e) => setRoadmapName(e.target.value)}
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono tracking-wider placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none" />
                </div>
                {/* Description */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-1.5">DESCRIPTION</label>
                  <textarea rows={3} placeholder="WHAT'S THIS ROADMAP FOR?"
                    value={roadmapDescription} onChange={(e) => setRoadmapDescription(e.target.value)}
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-3 text-white text-sm font-mono tracking-wider placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none resize-none" />
                </div>

                {/* Topics */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-1.5">TOPICS / TAGS</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_OPTIONS.map((topic) => (
                      <button key={topic} type="button" onClick={() => toggleTopic(topic)}
                        className={`px-2.5 py-1 border text-[9px] tracking-widest transition-colors ${selectedTopics.includes(topic)
                          ? "border-[#F7D046] text-[#F7D046] bg-[#F7D046]/5"
                          : "border-[#333] text-gray-600 hover:border-[#F7D046] hover:text-[#F7D046]"}`}>
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-1.5">VISIBILITY</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRoadmapVisibility("private")}
                      className={`flex-1 py-2.5 border-2 text-xs tracking-widest ${roadmapVisibility === "private"
                        ? "border-[#F7D046] text-[#F7D046] bg-[#F7D046]/5"
                        : "border-[#333] text-gray-500 hover:border-[#F7D046]"}`}>
                      🔒 PRIVATE
                    </button>
                    <button type="button" onClick={() => setRoadmapVisibility("public")}
                      className={`flex-1 py-2.5 border-2 text-xs tracking-widest ${roadmapVisibility === "public"
                        ? "border-[#4ECDC4] text-[#4ECDC4] bg-[#4ECDC4]/5"
                        : "border-[#333] text-gray-500 hover:border-[#4ECDC4]"}`}>
                      🌐 PUBLIC
                    </button>
                  </div>
                </div>

                {/* Selected problems summary */}
                <div className="border border-dashed border-[#333] p-3">
                  <p className="text-[10px] text-gray-500 tracking-widest mb-2">
                    SELECTED PROBLEMS <span className="text-[#F7D046]">({selectedProblemIds.length})</span>
                  </p>
                  {selectedProblemIds.length === 0 ? (
                    <p className="text-gray-700 text-[10px]">No problems selected — search and add from the right panel →</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {problemResults
                        .filter((p) => p.id && selectedProblemIds.includes(p.id))
                        .map((p) => {
                          const problemId = p.id;
                          if (!problemId) return null;
                          return (
                            <div key={problemId} className="flex items-center justify-between">
                              <span className="text-xs text-gray-300 font-mono">{p.main_heading}</span>
                              <button onClick={() => toggleProblem(problemId)}
                                className="text-[#E54B4B] text-[10px] hover:opacity-70 ml-2">✕</button>
                            </div>
                          );
                        })}
                      {/* show selected that aren't in current search */}
                      {selectedProblemIds.filter(id => !problemResults.find(p => p.id === id)).length > 0 && (
                        <p className="text-gray-700 text-[9px]">+{selectedProblemIds.filter(id => !problemResults.find(p => p.id === id)).length} more (scroll to see)</p>
                      )}
                    </div>
                  )}
                </div>

                {createError && <div className="border-2 border-[#E54B4B] px-4 py-2 text-[#E54B4B] text-[10px] tracking-widest">{createError}</div>}
                {createSuccess && <div className="border-2 border-[#4ECDC4] px-4 py-2 text-[#4ECDC4] text-[10px] tracking-widest">✓ ROADMAP CREATED!</div>}

                <button type="button" onClick={handleCreateRoadmap} disabled={isCreating}
                  className="w-full py-4 bg-[#F7D046] text-black text-sm font-bold tracking-widest hover:bg-[#f5c518] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {isCreating ? "CREATING..." : "CREATE ROADMAP ♛"}
                </button>
              </div>
            </div>

            {/* Right: problem search */}
            <div className="border-2 border-dashed border-[#333] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-gray-500 text-[10px] tracking-widest">SELECT PROBLEMS</span>
              <div className="mt-2 space-y-3">
                {/* Search bar */}
                <input type="text" placeholder="SEARCH PROBLEMS..."
                  value={problemSearch} onChange={(e) => setProblemSearch(e.target.value)}
                  className="w-full bg-transparent border-2 border-[#333] px-4 py-2.5 text-white text-sm font-mono placeholder:text-gray-700 focus:border-[#4ECDC4] focus:outline-none" />
                {/* Difficulty filter */}
                <div className="flex gap-2">
                  {["", "easy", "medium", "hard"].map((d) => (
                    <button key={d} onClick={() => setDifficultyFilter(d)}
                      className={`px-3 py-1 text-[9px] tracking-widest border transition-colors ${difficultyFilter === d
                        ? "border-[#4ECDC4] text-[#4ECDC4]"
                        : "border-[#333] text-gray-600 hover:border-[#4ECDC4]"}`}>
                      {d === "" ? "ALL" : d.toUpperCase()}
                    </button>
                  ))}
                </div>
                {/* Results */}
                <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                  {problemSearchLoading && (
                    <div className="text-center py-8 text-gray-600 text-xs tracking-widest">SEARCHING...</div>
                  )}
                  {!problemSearchLoading && problemResults.length === 0 && (
                    <div className="text-center py-8 text-gray-700 text-xs tracking-widest">NO PROBLEMS FOUND</div>
                  )}
                  {!problemSearchLoading && problemResults.map((problem) => {
                    const problemId = problem.id;
                    if (!problemId) return null;
                    const selected = selectedProblemIds.includes(problemId);
                    return (
                      <div key={problemId}
                        onClick={() => toggleProblem(problemId)}
                        className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${selected
                          ? "border-[#4ECDC4] bg-[#4ECDC4]/5"
                          : "border-[#222] hover:border-[#444]"}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-4 h-4 border-2 shrink-0 flex items-center justify-center text-[8px] ${selected ? "border-[#4ECDC4] bg-[#4ECDC4] text-black" : "border-[#444]"}`}>
                            {selected && "✓"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-white font-mono tracking-wide truncate">{problem.main_heading}</p>
                            {problem.tag && <p className="text-[9px] text-gray-600 truncate">{problem.tag}</p>}
                          </div>
                        </div>
                        <span className={`text-[9px] tracking-widest shrink-0 ml-2 ${diffColor(problem.difficulty)}`}>
                          {problem.difficulty?.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Roadmap detail modal ── */}
      {detailRoadmap && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setDetailRoadmap(null)}>
          <div className="bg-[#0d0d0d] border-2 border-[#F7D046] p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-lg tracking-wider">{detailRoadmap.name}</h2>
                {detailRoadmap.description && <p className="text-gray-500 text-xs mt-1">{detailRoadmap.description}</p>}
                <div className="flex gap-3 mt-2">
                  <span className={`text-[9px] tracking-widest px-2 border ${detailRoadmap.visibility === "public" ? "border-[#4ECDC4] text-[#4ECDC4]" : "border-[#555] text-gray-500"}`}>
                    {detailRoadmap.visibility.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-gray-600 tracking-widest">{detailRoadmap.total_problems} PROBLEMS</span>
                </div>
              </div>
              <button onClick={() => setDetailRoadmap(null)} className="text-gray-500 hover:text-white text-xl ml-4">✕</button>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-500 tracking-widest">PROGRESS</p>
                <span className="text-[#4ECDC4] text-xs font-mono">{detailRoadmap.progress}%</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] border border-[#333] mb-3">
                <div className="h-full bg-[#4ECDC4] transition-all" style={{ width: `${detailRoadmap.progress}%` }} />
              </div>
              <div className="flex gap-2">
                <input type="number" min={0} max={100} value={progressInput}
                  onChange={(e) => setProgressInput(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-20 bg-transparent border border-[#333] px-2 py-1.5 text-white text-xs font-mono focus:border-[#4ECDC4] focus:outline-none" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressInput}
                  onChange={(e) => setProgressInput(Number(e.target.value))}
                  className="flex-1 accent-[#4ECDC4]"
                />
                <button onClick={handleSaveProgress} disabled={savingProgress}
                  className="px-4 py-1.5 bg-[#4ECDC4] text-black text-xs font-bold tracking-widest hover:opacity-90 disabled:opacity-60">
                  {savingProgress ? "SAVING..." : "UPDATE %"}
                </button>
              </div>
            </div>

            {/* Topics */}
            {detailRoadmap.topics?.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] text-gray-500 tracking-widest mb-2">TOPICS</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailRoadmap.topics.map((t) => (
                    <span key={t} className="text-[9px] tracking-widest px-2 py-0.5 border border-[#333] text-gray-400">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Problems */}
            <div className="mb-5">
              <p className="text-[10px] text-gray-500 tracking-widest mb-2">
                PROBLEMS <span className="text-[#F7D046]">({detailRoadmap.problems?.length || 0})</span>
              </p>
              {(!detailRoadmap.problems || detailRoadmap.problems.length === 0) ? (
                <p className="text-gray-700 text-xs">No problems linked.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto border border-dashed border-[#222] p-3">
                  {detailRoadmap.problems.map((p: IRoadmapProblem) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-[10px]">○</span>
                        <Link to={`/problems/${p.slug}`}
                          className="text-xs text-gray-300 font-mono hover:text-[#4ECDC4] transition-colors"
                          onClick={() => setDetailRoadmap(null)}>
                          {p.title}
                        </Link>
                      </div>
                      <span className={`text-[9px] tracking-widest ${diffColor(p.difficulty)}`}>
                        {p.difficulty?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-4 border-t border-[#222]">
              <button onClick={() => setDetailRoadmap(null)}
                className="flex-1 py-2.5 border border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
                CLOSE
              </button>
              <button onClick={() => handleDelete(detailRoadmap.id)} disabled={deletingId === detailRoadmap.id}
                className="px-6 py-2.5 border border-[#E54B4B] text-[#E54B4B] text-xs tracking-widest hover:bg-[#E54B4B] hover:text-black transition-colors disabled:opacity-60">
                {deletingId === detailRoadmap.id ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default Roadmap;
