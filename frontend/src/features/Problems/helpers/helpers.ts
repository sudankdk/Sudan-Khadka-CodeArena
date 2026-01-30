import { filteredProblemsByDifficulty } from "@/services/auth/api/problemtest"

export const getProblmesCounts = async () => {
   const [easy, medium, hard] = await Promise.all([
        filteredProblemsByDifficulty("easy"),
        filteredProblemsByDifficulty("medium"),
        filteredProblemsByDifficulty("hard")
    ])
    return {
        easy: easy.data.total,
        medium: medium.data.total,
        hard: hard.data.total,
        total : easy.data.total + medium.data.total + hard.data.total
    }
}
