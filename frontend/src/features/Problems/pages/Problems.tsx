import UserDashboardLayout from "@/Components/UserDashboardLayout";
import { useProblem } from "@/features/Problems/hooks/useProblem";
import { useProblemCounts } from "@/features/Problems/hooks/useProblemCounts";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const Problems = () => {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page,setPage]=useState(1)
  
  const pageSize =10
  const {data,isLoading} = useProblem(page,pageSize)
  const { data: counts } = useProblemCounts();

const easy = counts?.easy ?? 0;
const medium = counts?.medium ?? 0;
const hard = counts?.hard ?? 0;
const total = counts?.total ?? 0;
  const filters = ["ALL", "EASY", "MED", "HARD", "SOLVED", "TODO"];

  const topics = [
    { name: "ARRAY", count: 156, color: "#F7D046" },
    { name: "STRING", count: 98, color: "#4ECDC4" },
    { name: "HASH", count: 87, color: "#E54B4B" },
    { name: "DP", count: 124, color: "#F7D046" },
    { name: "GRAPH", count: 65, color: "#4ECDC4" },
    { name: "TREE", count: 72, color: "#E54B4B" },
    { name: "BINARY", count: 45, color: "#F7D046" },
    { name: "STACK", count: 38, color: "#4ECDC4" },
    { name: "HEAP", count: 29, color: "#E54B4B" },
    { name: "GREEDY", count: 56, color: "#F7D046" },
  ];
  const handlePageChange = (page: number) => setPage(page);
  
  const problems = [
    { id: 1, name: "TWO SUM", difficulty: "EASY", acceptance: "49.2%", status: "solved", tags: ["ARRAY", "HASH"] },
    { id: 2, name: "ADD TWO NUMBERS", difficulty: "MED", acceptance: "40.1%", status: "solved", tags: ["LINKED LIST", "MATH"] },
    { id: 3, name: "LONGEST SUBSTRING WITHOUT REPEATING", difficulty: "MED", acceptance: "34.5%", status: "attempted", tags: ["STRING", "HASH"] },
    { id: 4, name: "MEDIAN OF TWO SORTED ARRAYS", difficulty: "HARD", acceptance: "38.9%", status: null, tags: ["ARRAY", "BINARY"] },
    { id: 5, name: "LONGEST PALINDROMIC SUBSTRING", difficulty: "MED", acceptance: "32.8%", status: null, tags: ["STRING", "DP"] },
    { id: 6, name: "ZIGZAG CONVERSION", difficulty: "MED", acceptance: "45.2%", status: "solved", tags: ["STRING"] },
    { id: 7, name: "REVERSE INTEGER", difficulty: "MED", acceptance: "27.8%", status: null, tags: ["MATH"] },
    { id: 8, name: "STRING TO INTEGER (ATOI)", difficulty: "MED", acceptance: "17.2%", status: "attempted", tags: ["STRING"] },
    { id: 9, name: "PALINDROME NUMBER", difficulty: "EASY", acceptance: "54.3%", status: "solved", tags: ["MATH"] },
    { id: 10, name: "REGULAR EXPRESSION MATCHING", difficulty: "HARD", acceptance: "28.1%", status: null, tags: ["STRING", "DP"] },
    { id: 11, name: "CONTAINER WITH MOST WATER", difficulty: "MED", acceptance: "54.8%", status: "solved", tags: ["ARRAY", "GREEDY"] },
    { id: 12, name: "INTEGER TO ROMAN", difficulty: "MED", acceptance: "62.1%", status: null, tags: ["MATH", "STRING"] },
  ];
  const NavToNextPage=()=>{
    if (data?.total<pageSize)return
    // handlePageChange(page+1)
    setPage((p)=>p+1)
  }
    const NavToPrevPage=()=>{
    if (page<=1)return
    // handlePageChange(page-1)
    setPage((p)=>p-1)
  }
  const difficultyColor = (d: string) => {
    if (d === "EASY") return "text-[#4ECDC4]";
    if (d === "MED") return "text-[#F7D046]";
    return "text-[#E54B4B]";
  };

  const filteredProblems = (data?.problems || []).filter((p) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "EASY") return p.difficulty === "easy";
    if (activeFilter === "MED") return p.difficulty === "medium";
    if (activeFilter === "HARD") return p.difficulty === "hard";
    // if (activeFilter === "SOLVED") return p.status === "solved";
    // if (activeFilter === "TODO") return !p.status;
    return true;
  }).filter((p) => (p.main_heading || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE ARCHIVE</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            PROBLEMS<span className="text-[#F7D046] ml-2">♛</span>
          </h1>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-6 mb-8 border-b-2 border-dashed border-[#333] pb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#4ECDC4] font-mono">{easy}</span>
            <span className="text-[10px] text-gray-500 tracking-widest">EASY</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#F7D046] font-mono">{medium}</span>
            <span className="text-[10px] text-gray-500 tracking-widest">MEDIUM</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#E54B4B] font-mono">{hard}</span>
            <span className="text-[10px] text-gray-500 tracking-widest">HARD</span>
          </div>
          <div className="ml-auto flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">1</span>
            <span className="text-[10px] text-gray-500 tracking-widest">/{total}</span>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search & Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="SEARCH PROBLEMS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-2 border-[#333] px-4 py-2 text-white text-xs font-mono tracking-wider placeholder:text-gray-600 focus:border-[#F7D046] focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">⌘K</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-6">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 text-[10px] font-mono tracking-widest transition-all ${
                    activeFilter === f
                      ? "bg-[#F7D046] text-black"
                      : "text-gray-500 hover:text-white border border-[#333] hover:border-[#F7D046]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Problems List */}
            <div className="border-2 border-dashed border-[#333]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
                {/* <div className="col-span-1">STATUS</div> */}
                <div className="col-span-6">TITLE</div>
                <div className="col-span-2">ACCEPTANCE</div>
                <div className="col-span-2">DIFFICULTY</div>
                <div className="col-span-1">DESC</div>
              </div>

              {/* Rows */}
              {filteredProblems.map((p, _) => (
                <NavLink
                  key={p.slug}
                  to={`/problems/${p.slug}`}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#222] last:border-0 hover:bg-[#F7D046]/5 transition-colors group"
                >
                  {/* <div className="col-span-1">
                    {p.status === "solved" && <span className="text-[#4ECDC4]">✓</span>}
                    {p.status === "attempted" && <span className="text-[#F7D046]">◐</span>}
                    {!p.status && <span className="text-[#333]">○</span>}
                  </div> */}
                  <div className="col-span-6 text-gray-300 text-xs font-mono tracking-wide group-hover:text-white">
                     {p.main_heading || 'Untitled'}
                  </div>
                  <div className="col-span-2 text-gray-500 text-xs font-mono">{p.acceptance || 'N/A'}</div>
                  <div className={`col-span-2 text-[10px] tracking-widest ${difficultyColor((p.difficulty || '').toUpperCase())}`}>
                    {(p.difficulty || 'UNKNOWN').toUpperCase()}
                  </div>
                  <div className="col-span-1 text-gray-600 text-xs">
                    {p.description.substring(0, 15)+"..."}
                  </div>
                </NavLink>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={NavToPrevPage} className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
                ← PREV
              </button>
              <button className="px-3 py-2 bg-[#F7D046] text-black text-xs font-mono">{page}</button>
              {
                data && data.total > page * pageSize && (
                  <button onClick={NavToNextPage} className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
                    {page + 1}
                  </button>
                )
              }
              <button onClick={NavToNextPage} className="px-3 py-2 border border-[#333] text-gray-500 text-xs font-mono hover:border-[#F7D046] hover:text-[#F7D046] transition-colors">
                NEXT →
              </button>
            </div>
          </div>

          {/* Sidebar - Topics */}
          <div className="w-64">
            <div className="border-2 border-dashed border-[#333] p-4">
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">SUBJECTS ♛</p>
              <div className="space-y-2">
                {topics.map((t) => (
                  <NavLink
                    key={t.name}
                    to={`/problems?topic=${t.name.toLowerCase()}`}
                    className="flex justify-between items-center py-2 border-b border-[#222] hover:border-[#F7D046] transition-colors group"
                  >
                    <span className="text-gray-400 text-xs font-mono tracking-wider group-hover:text-white">
                      {t.name}
                    </span>
                    <span style={{ color: t.color }} className="text-xs font-mono">
                      {t.count}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="mt-6 border-2 border-[#E54B4B] p-4 relative">
              <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">★</span>
              <p className="text-[10px] text-gray-600 tracking-widest mb-2">DAILY CHALLENGE</p>
              <p className="text-white text-sm font-mono mb-2">15. THREE SUM</p>
              <p className="text-[#F7D046] text-[10px] tracking-widest mb-3">MEDIUM</p>
              <button className="w-full py-2 bg-[#E54B4B] text-white text-xs font-bold tracking-widest hover:bg-[#c43e3e] transition-colors">
                SOLVE NOW
              </button>
            </div>

           
          </div>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Problems;
