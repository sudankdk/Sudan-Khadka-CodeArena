import { Button } from '@/components/ui/button';
import type { IContestProblem } from '@/types/contest/contest';
import { difficultyColor } from '../../utils/contestHelpers';

interface ProblemsListProps {
  problems: IContestProblem[];
  onRemove?: (problemId: string) => void;
  isRemoving?: boolean;
  showActions?: boolean;
}

export const ProblemsList = ({ 
  problems, 
  onRemove, 
  isRemoving,
  showActions = true 
}: ProblemsListProps) => {
  if (problems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">No problems added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {problems.map((problem) => (
        <div
          key={problem.problem_id}
          className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-gray-900 font-semibold">
                  {problem.problem?.main_heading || 'Unknown Problem'}
                </h3>
                <span
                  className="px-2 py-1 rounded text-xs font-mono font-bold"
                  style={{
                    backgroundColor: `${difficultyColor(problem.problem?.difficulty || 'medium')}20`,
                    color: difficultyColor(problem.problem?.difficulty || 'medium'),
                  }}
                >
                  {problem.problem?.difficulty || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Max Points:</span>
                  <span className="text-gray-900 font-semibold">
                    {problem.max_points}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Order:</span>
                  <span className="text-gray-900">
                    #{problem.order_index}
                  </span>
                </div>
              </div>
            </div>

            {showActions && onRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(problem.problem_id)}
                disabled={isRemoving}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
