import { useMutation } from "@tanstack/react-query";
import { getHint, type HintRequest } from "@/services/auth/api/hint";

export const useHint = () => {
  return useMutation({
    mutationFn: (req: HintRequest) => getHint(req),
  });
};
