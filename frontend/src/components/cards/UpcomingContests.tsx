import { Icons } from '@/constants/Icons';
import { cn } from "@/lib/utils";

interface Contest {
  id: string;
  name: string;
  date: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  registered: boolean;
}

const mockContests: Contest[] = [
  { id: "1", name: "Weekly Challenge #45", date: "Jan 5, 2026 - 10:00 AM", duration: "2 hours", difficulty: "Medium", registered: true },
  { id: "2", name: "Algorithm Sprint", date: "Jan 8, 2026 - 2:00 PM", duration: "1.5 hours", difficulty: "Hard", registered: false },
  { id: "3", name: "Beginner's Contest", date: "Jan 10, 2026 - 6:00 PM", duration: "1 hour", difficulty: "Easy", registered: false },
];

const difficultyStyles = {
  Easy: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-700",
};

const UpcomingContests = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Icons.Trophy className="w-4 h-4 text-slate-500" />
          Upcoming Contests
        </h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {mockContests.map((contest) => (
          <div
            key={contest.id}
            className="px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800">{contest.name}</p>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", difficultyStyles[contest.difficulty])}>
                    {contest.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Icons.Calendar className="w-3.5 h-3.5" />
                    {contest.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.Clock className="w-3.5 h-3.5" />
                    {contest.duration}
                  </span>
                </div>
              </div>
              <button
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  contest.registered
                    ? "bg-slate-100 text-slate-600 cursor-default"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
                )}
                disabled={contest.registered}
              >
                {contest.registered ? "Registered" : "Register"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingContests;
