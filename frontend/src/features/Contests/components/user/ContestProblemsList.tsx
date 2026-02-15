import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { IContestProblem } from '@/types/contest/contest';
import { difficultyColor } from '../../utils/contestHelpers';

interface ContestProblemsListProps {
  problems: IContestProblem[];
  contestId: string;
  isLoading?: boolean;
}

export const ContestProblemsList = ({ 
  problems, 
  contestId,
  isLoading 
}: ContestProblemsListProps) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
        <p className="text-gray-400 font-mono">Loading problems...</p>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
        <p className="text-gray-400 font-mono">No problems in this contest yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Problem
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-6 py-4 text-left text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Max Points
              </th>
              <th className="px-6 py-4 text-right text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {problems.map((problem, index) => (
              <tr 
                key={problem.problem_id}
                className="hover:bg-[#222] transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-gray-400 font-mono font-bold">
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    to={`/contests/${contestId}/problems/${problem.problem?.slug || problem.problem_id}`}
                    className="text-white font-mono font-semibold hover:text-[#F7D046] transition-colors"
                  >
                    {problem.problem?.main_heading || 'Unknown Problem'}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${difficultyColor(problem.problem?.difficulty || 'medium')}20`,
                      color: difficultyColor(problem.problem?.difficulty || 'medium'),
                    }}
                  >
                    {problem.problem?.difficulty || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[#F7D046] font-mono font-bold">
                    {problem.max_points}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/contests/${contestId}/problems/${problem.problem?.slug || problem.problem_id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-[#4ECDC4] text-[#4ECDC4] hover:bg-[#4ECDC4] hover:text-black font-mono transition-colors"
                    >
                      Solve
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
