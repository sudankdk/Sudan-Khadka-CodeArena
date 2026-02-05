import { cn } from "@/lib/utils";
import { Icons } from '@/constants/Icons';

interface Submission {
  id: string;
  problemName: string;
  status: "Accepted" | "Wrong Answer" | "Time Limit" | "Runtime Error";
  language: string;
  time: string;
}

const mockSubmissions: Submission[] = [
  { id: "1", problemName: "Two Sum", status: "Accepted", language: "Python", time: "2 hours ago" },
  { id: "2", problemName: "Binary Search", status: "Wrong Answer", language: "JavaScript", time: "5 hours ago" },
  { id: "3", problemName: "Merge Sort", status: "Accepted", language: "Go", time: "1 day ago" },
  { id: "4", problemName: "Graph DFS", status: "Time Limit", language: "C++", time: "2 days ago" },
  { id: "5", problemName: "Dynamic Programming", status: "Accepted", language: "Python", time: "3 days ago" },
];

const statusStyles = {
  "Accepted": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Wrong Answer": "bg-red-50 text-red-700 border-red-200",
  "Time Limit": "bg-amber-50 text-amber-700 border-amber-200",
  "Runtime Error": "bg-orange-50 text-orange-700 border-orange-200",
};

const RecentSubmissions = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Icons.Clock className="w-4 h-4 text-slate-500" />
          Recent Submissions
        </h3>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          View All
        </button>
      </div>
      
      <div className="divide-y divide-slate-100">
        {mockSubmissions.map((submission) => (
          <div
            key={submission.id}
            className="px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{submission.problemName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{submission.language} • {submission.time}</p>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap",
                statusStyles[submission.status]
              )}
            >
              {submission.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSubmissions;
