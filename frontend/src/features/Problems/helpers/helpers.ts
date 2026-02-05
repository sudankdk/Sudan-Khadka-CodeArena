import { filteredProblemsByDifficulty } from "@/services/auth/api/problemtest"

export const getProblmesCounts = async () => {
    const [easy, medium, hard] = await Promise.all([
        filteredProblemsByDifficulty("easy"),
        filteredProblemsByDifficulty("medium"),
        filteredProblemsByDifficulty("hard")
    ])
    return {
        easy: easy.length,
        medium: medium.length,
        hard: hard.length,
        total: easy.length + medium.length + hard.length
    }
}
