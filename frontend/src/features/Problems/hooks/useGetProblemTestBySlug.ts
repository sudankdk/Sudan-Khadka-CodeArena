import {useQuery} from '@tanstack/react-query';
import { getProblemTestBySlug } from "../../../services/auth/api/problemtest";

export const useGetProblemTestBySlug = (slug: string) => {
    return useQuery({
        queryKey: ['problemTest', slug],
        queryFn: () => getProblemTestBySlug(slug),
    });
}