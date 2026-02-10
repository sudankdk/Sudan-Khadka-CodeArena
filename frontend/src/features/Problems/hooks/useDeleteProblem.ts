import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProblemTest } from "@/services/auth/api/problemtest";

export const useDeleteProblem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProblemTest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['problems'] });
        }
    });
}
