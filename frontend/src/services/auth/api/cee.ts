import {  server2 } from "../../../const/server";
import { ApiClient } from "../client";
export const ceeClient = new ApiClient(server2);

export const executeCode = async (language :string, code:string, stdin:string) =>{
    const resp=await ceeClient.post<any>("",{
        language,
        code,
        stdin
    });

    return resp;
}