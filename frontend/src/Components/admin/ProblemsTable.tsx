import type { IProblemTest } from "@/Interfaces/problemstest/problemtest";

interface ProblemsTableProps {
  problems: IProblemTest[];
  loading: boolean;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy": return "text-green-600 bg-green-100";
    case "medium": return "text-yellow-600 bg-yellow-100";
    case "hard": return "text-red-600 bg-red-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

export const ProblemsTable = ({ problems, loading }: ProblemsTableProps) => {
  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading problems...</div>;
  }

  if (problems.length === 0) {
    return <div className="p-12 text-center text-gray-500">No problems found. Create your first problem!</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tag
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Difficulty
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Test Cases
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {problems.map((problem, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{problem.main_heading}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{problem.slug}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {problem.tag}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {problem.test_cases.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
