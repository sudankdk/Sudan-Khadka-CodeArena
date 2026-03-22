import {  server2 } from '../../../constants/server';
import { ApiClient } from "../client";

export const ceeClient = new ApiClient(server2);

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
}

export const executeCode = async (language: string, code: string, stdin: string): Promise<ExecuteCodeResponse> => {
    try {
        console.log("Executing code with language:", language);
        const resp = await ceeClient.post<ExecuteCodeResponse>("/execute", {
            language,
            code,
            stdin
        });
        console.log("Code execution response:", resp);
        return resp;
    } catch (error: any) {
        // Handle API errors gracefully
        console.log(error)
        const errorMessage = error?.response?.data?.error || error?.message || "Code execution failed";
        throw new Error(errorMessage);
    }
}