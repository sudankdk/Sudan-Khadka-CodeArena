import UserDashboardLayout from "@/Components/UserDashboardLayout";
import { useState } from "react";

const Duel = () => {
  const [activeTab, setActiveTab] = useState("LOBBY");
  const [roomCode, setRoomCode] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [timeLimit, setTimeLimit] = useState("30");

  const tabs = ["LOBBY", "CREATE", "JOIN", "HISTORY"];

  const activeRooms = [
    { id: "SAMO-1234", host: "ALGO_KING", difficulty: "HARD", timeLimit: "45 MIN", players: "1/2", rating: "2000+" },
    { id: "CROWN-5678", host: "CODE_WARRIOR", difficulty: "MEDIUM", timeLimit: "30 MIN", players: "1/2", rating: "1500+" },
    { id: "BEAST-9012", host: "GRAPH_GURU", difficulty: "EASY", timeLimit: "20 MIN", players: "1/2", rating: "ANY" },
    { id: "FIRE-3456", host: "DP_DYNAMO", difficulty: "MEDIUM", timeLimit: "30 MIN", players: "1/2", rating: "1800+" },
  ];

  const liveMatches = [
    { id: 1, player1: "RADIANT_CODER", player2: "BINARY_BEAST", problem: "MERGE K SORTED", timeLeft: "12:34", status: "LIVE" },
    { id: 2, player1: "STACK_OVERFLOW", player2: "HASH_HERO", problem: "LRU CACHE", timeLeft: "08:21", status: "LIVE" },
    { id: 3, player1: "LOOP_MASTER", player2: "TREE_TRAVERSER", problem: "TWO SUM", timeLeft: "02:45", status: "ENDING" },
  ];

  const recentDuels = [
    { id: 1, opponent: "ALGO_KING", result: "WIN", problem: "VALID PARENTHESES", yourTime: "4:23", theirTime: "5:12", rating: "+15" },
    { id: 2, opponent: "CODE_WARRIOR", result: "LOSS", problem: "LONGEST SUBSTRING", yourTime: "DNF", theirTime: "12:45", rating: "-12" },
    { id: 3, opponent: "NEWBIE_CODER", result: "WIN", problem: "TWO SUM", yourTime: "2:01", theirTime: "3:45", rating: "+8" },
    { id: 4, opponent: "RECURSIVE_MIND", result: "DRAW", problem: "ADD TWO NUMBERS", yourTime: "8:34", theirTime: "8:34", rating: "0" },
  ];

  const generateRoomCode = () => {
    const words = ["SAMO", "CROWN", "BEAST", "FIRE", "KING", "GOLD", "SAMO", "JAZZ"];
    const word = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${word}-${num}`;
  };

  const getDifficultyColor = (d: string) => {
    if (d === "EASY") return "text-[#4ECDC4] border-[#4ECDC4]";
    if (d === "MEDIUM") return "text-[#F7D046] border-[#F7D046]";
    return "text-[#E54B4B] border-[#E54B4B]";
  };

  const getResultColor = (r: string) => {
    if (r === "WIN") return "text-[#4ECDC4]";
    if (r === "LOSS") return "text-[#E54B4B]";
    return "text-[#F7D046]";
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600 text-xs font-mono tracking-widest mb-1">THE COLOSSEUM</p>
          <h1 className="text-3xl text-white font-bold tracking-tight">
            1 VS 1<span className="text-[#E54B4B] ml-2">⚔</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2">"I AM NOT A NEGRO ARTIST, I AM AN ARTIST" — JMB</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">W</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">23</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WINS</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">L</span>
            <p className="text-3xl font-bold text-[#E54B4B] font-mono">8</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">LOSSES</p>
          </div>
          <div className="border-2 border-[#F7D046] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#F7D046] text-xs">%</span>
            <p className="text-3xl font-bold text-[#F7D046] font-mono">74%</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WIN RATE</p>
          </div>
          <div className="border-2 border-[#333] p-4 relative">
            <span className="absolute -top-2 -right-2 text-gray-500 text-xs">🔥</span>
            <p className="text-3xl font-bold text-white font-mono">5</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">WIN STREAK</p>
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

        {/* LOBBY */}
        {activeTab === "LOBBY" && (
          <div className="space-y-6">
            {/* Live Matches */}
            <div className="border-2 border-[#E54B4B] p-4 relative">
              <div className="absolute top-0 right-0 bg-[#E54B4B] px-3 py-1">
                <span className="text-white text-xs font-mono tracking-widest animate-pulse">● LIVE</span>
              </div>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">ONGOING BATTLES</p>
              <div className="space-y-3">
                {liveMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between py-3 border-b border-[#333] last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-mono text-sm">{match.player1}</span>
                      <span className="text-[#E54B4B] text-lg">⚔</span>
                      <span className="text-white font-mono text-sm">{match.player2}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-500 text-xs font-mono">{match.problem}</span>
                      <span className={`text-lg font-mono font-bold ${match.status === "ENDING" ? "text-[#F7D046]" : "text-[#E54B4B]"}`}>
                        {match.timeLeft}
                      </span>
                      <button className="px-3 py-1 border border-[#E54B4B] text-[#E54B4B] text-[10px] tracking-widest hover:bg-[#E54B4B] hover:text-white transition-colors">
                        SPECTATE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Rooms */}
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">OPEN ROOMS</p>
              <div className="grid grid-cols-2 gap-4">
                {activeRooms.map((room) => (
                  <div key={room.id} className="border-2 border-dashed border-[#333] p-4 hover:border-[#F7D046] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[#F7D046] font-mono font-bold">{room.id}</p>
                        <p className="text-gray-500 text-xs">by {room.host}</p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] tracking-widest border ${getDifficultyColor(room.difficulty)}`}>
                        {room.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-3">
                      <span>⏱ {room.timeLimit}</span>
                      <span>👥 {room.players}</span>
                      <span>📊 {room.rating}</span>
                    </div>
                    <button className="w-full py-2 bg-[#F7D046] text-black text-xs font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
                      JOIN BATTLE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CREATE */}
        {activeTab === "CREATE" && (
          <div className="max-w-md mx-auto">
            <div className="border-2 border-[#F7D046] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#F7D046] text-xs tracking-widest">CREATE ROOM</span>
              
              <div className="space-y-6 mt-4">
                {/* Room Code */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">ROOM CODE</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="SAMO-1234"
                      className="flex-1 bg-transparent border-2 border-[#333] px-4 py-3 text-[#F7D046] text-lg font-mono tracking-wider placeholder:text-gray-700 focus:border-[#F7D046] focus:outline-none text-center"
                    />
                    <button
                      onClick={() => setRoomCode(generateRoomCode())}
                      className="px-4 py-3 border-2 border-[#333] text-gray-500 text-xs tracking-widest hover:border-[#F7D046] hover:text-[#F7D046] transition-colors"
                    >
                      GENERATE
                    </button>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">DIFFICULTY</label>
                  <div className="flex gap-2">
                    {["EASY", "MEDIUM", "HARD"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 text-xs font-mono tracking-widest transition-all border-2 ${
                          difficulty === d
                            ? getDifficultyColor(d) + " bg-white/5"
                            : "border-[#333] text-gray-600 hover:border-gray-500"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">TIME LIMIT (MINUTES)</label>
                  <div className="flex gap-2">
                    {["15", "30", "45", "60"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeLimit(t)}
                        className={`flex-1 py-3 text-xs font-mono tracking-widest transition-all border-2 ${
                          timeLimit === t
                            ? "border-[#F7D046] text-[#F7D046] bg-[#F7D046]/5"
                            : "border-[#333] text-gray-600 hover:border-gray-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <button className="w-full py-4 bg-[#E54B4B] text-white text-sm font-bold tracking-widest hover:bg-[#c43e3e] transition-colors">
                  CREATE ROOM ⚔
                </button>
              </div>
            </div>

            {/* Share Info */}
            <div className="mt-6 text-center text-[10px] text-gray-600">
              <p>SHARE THE ROOM CODE WITH YOUR OPPONENT</p>
              <p className="text-gray-500 mt-1">THEY CAN JOIN USING THE "JOIN" TAB</p>
            </div>
          </div>
        )}

        {/* JOIN */}
        {activeTab === "JOIN" && (
          <div className="max-w-md mx-auto">
            <div className="border-2 border-[#4ECDC4] p-6 relative">
              <span className="absolute -top-3 left-4 bg-[#0d0d0d] px-2 text-[#4ECDC4] text-xs tracking-widest">JOIN ROOM</span>
              
              <div className="space-y-6 mt-4">
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest block mb-2">ENTER ROOM CODE</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="SAMO-1234"
                    className="w-full bg-transparent border-2 border-[#333] px-4 py-4 text-[#4ECDC4] text-2xl font-mono tracking-widest placeholder:text-gray-700 focus:border-[#4ECDC4] focus:outline-none text-center"
                  />
                </div>

                <button className="w-full py-4 bg-[#4ECDC4] text-black text-sm font-bold tracking-widest hover:bg-[#3dbdb5] transition-colors">
                  JOIN BATTLE ⚔
                </button>
              </div>
            </div>

            {/* Or */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 border-t border-dashed border-[#333]"></div>
              <span className="text-gray-600 text-xs tracking-widest">OR</span>
              <div className="flex-1 border-t border-dashed border-[#333]"></div>
            </div>

            {/* Quick Match */}
            <div className="border-2 border-dashed border-[#333] p-6 text-center">
              <p className="text-[10px] text-gray-600 tracking-widest mb-4">FEELING LUCKY?</p>
              <button className="px-8 py-4 bg-[#F7D046] text-black text-sm font-bold tracking-widest hover:bg-[#f5c518] transition-colors">
                QUICK MATCH ⚡
              </button>
              <p className="text-[10px] text-gray-600 mt-3">FIND A RANDOM OPPONENT</p>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "HISTORY" && (
          <div className="border-2 border-dashed border-[#333]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-dashed border-[#333] text-[10px] text-gray-600 tracking-widest">
              <div className="col-span-2">RESULT</div>
              <div className="col-span-3">OPPONENT</div>
              <div className="col-span-3">PROBLEM</div>
              <div className="col-span-2">YOUR TIME</div>
              <div className="col-span-2">RATING</div>
            </div>
            {recentDuels.map((duel) => (
              <div
                key={duel.id}
                className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-[#222] last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2">
                  <span className={`font-bold tracking-widest ${getResultColor(duel.result)}`}>
                    {duel.result}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-white font-mono text-sm">{duel.opponent}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-gray-400 text-xs font-mono">{duel.problem}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-300 font-mono text-sm">{duel.yourTime}</span>
                  <span className="text-gray-600 text-xs ml-2">vs {duel.theirTime}</span>
                </div>
                <div className="col-span-2">
                  <span className={`font-mono font-bold ${duel.rating.startsWith("+") ? "text-[#4ECDC4]" : duel.rating.startsWith("-") ? "text-[#E54B4B]" : "text-gray-600"}`}>
                    {duel.rating !== "0" ? duel.rating : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Basquiat */}
        <div className="mt-10 text-[#222] text-[8px] font-mono">
          <p>"I CROSS OUT WORDS SO YOU WILL SEE THEM MORE;</p>
          <p>THE FACT THAT THEY ARE OBSCURED MAKES YOU WANT TO READ THEM."</p>
          <p className="text-[#E54B4B] mt-1">— SAMO© 1982</p>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default Duel;
