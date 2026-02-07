import UserDashboardLayout from '@/components/UserDashboardLayout';
import useAuthStore from "@/services/auth/store/auth.store";
import { NavLink } from "react-router-dom";
import { useUserStats, useTopicStats } from "@/hooks/useSubmissions";

const UserDashboard = () =>  {
  const user = useAuthStore((state) => state.user);
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const { data: topicStats, isLoading: topicsLoading } = useTopicStats();

  const difficultyColor = (d: string) => {
    if (d === "EASY" || d === "easy") return "text-[#4ECDC4]";
    if (d === "MED" || d === "medium") return "text-[#F7D046]";
    return "text-[#E54B4B]";
  };

  const getStatusIcon = (status: string) => {
    if (status === "accepted") return <span className="text-[#4ECDC4] text-sm">✓</span>;
    if (status === "wrong_answer") return <span className="text-[#F7D046] text-sm">○</span>;
    return <span className="text-[#333] text-sm">○</span>;
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
            <p className="text-3xl font-bold text-white font-mono">
              {statsLoading ? "..." : userStats?.total_solved || 0}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">SOLVED</p>
          </div>
          <div className="border-2 border-[#4ECDC4] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#4ECDC4] text-xs">™</span>
            <p className="text-3xl font-bold text-[#4ECDC4] font-mono">{user?.rating || 1420}</p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">RATING</p>
          </div>
          <div className="border-2 border-[#E54B4B] p-4 relative">
            <span className="absolute -top-2 -right-2 text-[#E54B4B] text-xs">®</span>
            <p className="text-3xl font-bold text-white font-mono">
              {statsLoading ? "..." : `${userStats?.acceptance_rate.toFixed(0) || 0}%`}
            </p>
            <p className="text-[10px] text-gray-500 tracking-widest mt-1">ACCEPTANCE</p>
          </div>
        </div>

        {/* Difficulty Stats */}
        {userStats && !statsLoading && (
          <div className="mb-10 border-2 border-dashed border-[#333] p-4">
            <p className="text-[10px] text-gray-600 tracking-widest mb-3">PROBLEMS SOLVED</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-[#4ECDC4] font-mono">{userStats.easy_solved}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">EASY</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F7D046] font-mono">{userStats.medium_solved}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">MEDIUM</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#E54B4B] font-mono">{userStats.hard_solved}</p>
                <p className="text-[10px] text-gray-500 tracking-widest">HARD</p>
              </div>
            </div>
          </div>
        )}

        {/* Topics */}
        <div className="mb-10">
          <p className="text-[10px] text-gray-600 tracking-widest mb-3">STUDY SUBJECTS</p>
          <div className="flex flex-wrap gap-2">
            {topicsLoading ? (
              <p className="text-gray-500 text-xs">Loading topics...</p>
            ) : (
              topicStats?.map((t) => (
                <NavLink
                  key={t.tag}
                  to={`/problems?tag=${t.tag.toLowerCase()}`}
                  className="px-3 py-2 border border-[#333] hover:border-[#F7D046] text-white text-xs font-mono tracking-wider transition-colors group"
                >
                  {t.tag.toUpperCase()}
                  <span className="text-gray-600 ml-2 group-hover:text-[#F7D046]">{t.count}</span>
                </NavLink>
              ))
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="border-2 border-dashed border-[#333] p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-gray-600 tracking-widest">RECENT SUBMISSIONS</p>
            <NavLink to="/problems" className="text-[10px] text-[#F7D046] tracking-widest hover:underline">
              VIEW ALL →
            </NavLink>
          </div>
          <div className="space-y-1">
            {statsLoading ? (
              <p className="text-gray-500 text-xs">Loading submissions...</p>
            ) : userStats?.recent_submissions && userStats.recent_submissions.length > 0 ? (
              userStats.recent_submissions.slice(0, 5).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between py-2 border-b border-[#222] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(submission.status)}
                    <NavLink 
                      to={`/problems/${submission.problem_slug}`}
                      className="text-gray-300 text-xs font-mono tracking-wide hover:text-[#F7D046]"
                    >
                      {submission.problem_title}
                    </NavLink>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] tracking-widest ${difficultyColor(submission.difficulty || '')}`}>
                      {submission.difficulty?.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-xs">No submissions yet</p>
                <p className="text-gray-600 text-[10px] mt-1">Start solving problems!</p>
              </div>
            )}
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
