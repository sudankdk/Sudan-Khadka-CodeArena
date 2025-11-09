import { server } from "../../../const/server";
import type { IUserRegister } from "../../../Interfaces/auth/auth";
import { ApiClient } from "../client";

export const authClient = new ApiClient(server);

export const registerUser = (data: IUserRegister):Promise<any> =>{
    return authClient.post("/register",data)
}