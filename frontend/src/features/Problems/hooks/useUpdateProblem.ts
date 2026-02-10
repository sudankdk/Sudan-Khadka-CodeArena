import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProblemTest } from "@/services/auth/api/problemtest";
import type { IProblemTest } from '@/types/problemstest/problemtest';

export const useUpdateProblem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<IProblemTest> }) => 
            updateProblemTest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['problems'] });
        }
    });
}
