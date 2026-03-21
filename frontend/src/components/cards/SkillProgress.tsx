import { cn } from "@/lib/utils";

interface Skill {
  name: string;
  solved: number;
  total: number;
  color: string;
}

const skills: Skill[] = [
  { name: "Arrays", solved: 45, total: 60, color: "bg-indigo-500" },
  { name: "Strings", solved: 32, total: 50, color: "bg-purple-500" },
  { name: "Dynamic Programming", solved: 18, total: 40, color: "bg-emerald-500" },
  { name: "Graphs", solved: 12, total: 35, color: "bg-amber-500" },
  { name: "Trees", solved: 22, total: 30, color: "bg-rose-500" },
];

const SkillProgress = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Problem Solving Progress</h3>
      
      <div className="space-y-4">
        {skills.map((skill) => {
          const percentage = Math.round((skill.solved / skill.total) * 100);
          return (
            <div key={skill.name} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                <span className="text-xs text-slate-500">
                  {skill.solved}/{skill.total} ({percentage}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 group-hover:opacity-80",
                    skill.color
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total Problems Solved</span>
          <span className="font-semibold text-slate-800">
            {skills.reduce((acc, s) => acc + s.solved, 0)} / {skills.reduce((acc, s) => acc + s.total, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SkillProgress;
