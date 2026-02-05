import { Icons } from '@/constants/Icons';
import useAuthStore from "@/services/auth/store/auth.store";

const ProfileCard = () => {
  const user = useAuthStore((state) => state.user);

  const getRankBadge = (rating: number) => {
    if (rating >= 2000) return { label: "Master", color: "from-amber-400 to-amber-600" };
    if (rating >= 1600) return { label: "Expert", color: "from-purple-500 to-purple-700" };
    if (rating >= 1200) return { label: "Specialist", color: "from-cyan-500 to-cyan-700" };
    if (rating >= 800) return { label: "Pupil", color: "from-emerald-500 to-emerald-700" };
    return { label: "Newbie", color: "from-slate-400 to-slate-600" };
  };

  const rankBadge = getRankBadge(user?.rating || 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 relative">
        <div className="absolute -bottom-10 left-5">
          <div className="w-20 h-20 rounded-xl bg-white p-1 shadow-lg">
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-5 px-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{user?.username || "User"}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${rankBadge.color}`}>
            {rankBadge.label}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-800">{user?.rating || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Rating</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-xl font-bold text-slate-800">#{user?.rank || "-"}</p>
            <p className="text-xs text-slate-500 mt-0.5">Global Rank</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-800">{user?.submissions_count || 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Submissions</p>
          </div>
        </div>

        {/* Match Stats */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Icons.Trophy className="w-4 h-4 text-amber-500" />
            <span>Matches Won</span>
          </div>
          <span className="font-semibold text-slate-800">
            {user?.matches_won || 0}/{user?.matches_played || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
