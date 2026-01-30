import { useMutation } from "@tanstack/react-query";
import { executeCode } from "../../../services/auth/api/cee";

export const useExecuteCode = () => {
  return useMutation({
    mutationFn: ({ language, code, stdin }: { language: string; code: string; stdin: string }) =>
      executeCode(language, code, stdin),
    onSuccess: (data) => {
      console.log("Execution Result:", data);
    },
    onError: (error) => {
      console.error("Execution Error:", error);
    },
  });
};


