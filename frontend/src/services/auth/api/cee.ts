import { ApiClient } from "../client";

// Allow configuring Judge0 URL via env, fallback to common open instance or localhost
export const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
export const JUDGE0_HOST = import.meta.env.VITE_JUDGE0_HOST || "judge0-ce.p.rapidapi.com";
export const JUDGE0_KEY = import.meta.env.VITE_JUDGE0_KEY || ""; 

export interface ExecuteCodeRequest {
    language: string;
    code: string;
    stdin: string;
}

export interface ExecuteCodeResponse {
    stdout: string;
    stderr: string;
    error?: string;
    exitCode?: number;
    time?: number;
    memory?: number;
}

const getLanguageId = (language: string): number => {
    switch (language.toLowerCase()) {
        case 'python':
        case 'py':
            return 71; // Python 3.8.1
        case 'javascript':
        case 'js':
            return 93; // Node.js 18.15.0
        case 'go':
            return 95; // Go 1.18.5
        case 'cpp':
        case 'c++':
            return 54; // C++ (GCC 9.2.0)
        default:
            return 71; // Default to Python if unknown
    }
};

export const executeCode = async (language: string, code: string, stdin: string): Promise<ExecuteCodeResponse> => {
    try {
        console.log("Executing code with language:", language, "using Judge0");
        const languageId = getLanguageId(language);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (JUDGE0_URL.includes("rapidapi.com")) {
            headers["X-RapidAPI-Host"] = JUDGE0_HOST;
            headers["X-RapidAPI-Key"] = JUDGE0_KEY;
        }

        const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                source_code: btoa(unescape(encodeURIComponent(code))),
                language_id: languageId,
                stdin: stdin ? btoa(unescape(encodeURIComponent(stdin))) : undefined,
            }),
        });

        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Judge0 API error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("Judge0 execution response:", result);

        const decodeBase64 = (str: string | null) => {
            if (!str) return "";
            try {
                return decodeURIComponent(escape(atob(str)));
            } catch (e) {
                return atob(str);
            }
        };

        // Map Judge0 response Format to our ExecuteCodeResponse format
        // Judge0 Status IDs:
        // 3: Accepted (Success)
        // 4: Wrong Answer (For this context, stdout outputted)
        // 5: Time Limit Exceeded
        // 6: Compilation Error
        // 7-12: Runtime Error
        
        let errorMsg = decodeBase64(result.stderr);
        if (result.compile_output) {
            errorMsg = decodeBase64(result.compile_output);
        } else if (result.status?.id === 5) {
            errorMsg = "Time Limit Exceeded";
        } else if (result.status?.id >= 7 && result.status?.id <= 12) {
            errorMsg += `\nRuntime Error: ${result.status.description}`;
        }

        return {
            stdout: decodeBase64(result.stdout),
            stderr: errorMsg,
            exitCode: result.status?.id === 3 ? 0 : 1, // 0 for success
            time: result.time ? parseFloat(result.time) * 1000 : 0, // convert seconds to ms
            memory: result.memory || 0, // memory is usually in KB
        };

    } catch (error: any) {
        // Handle API errors gracefully
        console.error("Code execution error:", error);
        const errorMessage = error?.response?.data?.error || error?.message || "Code execution failed";
        throw new Error(errorMessage);
    }
}