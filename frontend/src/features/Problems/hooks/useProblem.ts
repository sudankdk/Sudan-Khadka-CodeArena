import { useQuery } from "@tanstack/react-query";
import { getProblemTests } from "@/services/auth/api/problemtest";

export const useProblem =(currentPage: number, pageSize: number)=>{
    return useQuery({
        queryKey: ['problems',pageSize,currentPage],
        queryFn: () => getProblemTests(currentPage, pageSize),
    })
}