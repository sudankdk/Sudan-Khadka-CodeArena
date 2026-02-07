import { getProblemTests } from "@/services/auth/api/problemtest"

export const getProblmesCounts = async () => {
    // Get all problems with a large page size to get the total count
    const response = await getProblemTests(1, 1000);
    const problems = response.problems;

    return {
        easy: problems.filter(p => p.difficulty === 'easy').length,
        medium: problems.filter(p => p.difficulty === 'medium').length,
        hard: problems.filter(p => p.difficulty === 'hard').length,
        total: response.total
    }
}
