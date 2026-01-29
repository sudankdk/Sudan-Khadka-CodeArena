import { useMutation ,useQueryClient} from "@tanstack/react-query";

import { createProblemTest } from "@/services/auth/api/problemtest";

export const useCreateProblem = ()=>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProblemTest,
        onSuccess: ()=>{
            queryClient.invalidateQueries({queryKey:['problems']});
            
        }
    })}