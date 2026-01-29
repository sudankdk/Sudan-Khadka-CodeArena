import { useQuery } from "@tanstack/react-query";
import { getProblmesCounts } from "../helpers/helpers";

export const useProblemCounts = () => {
    return useQuery({
        queryKey: ['problemCounts'],
        queryFn: getProblmesCounts,
    })
}