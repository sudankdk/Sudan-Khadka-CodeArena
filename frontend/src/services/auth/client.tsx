import axios, { type AxiosInstance } from "axios";

export class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({ baseURL });

        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    get<T>(url: string) {
        return this.client.get<T>(url).then(res => res.data);
    }

    post<T>(url: string, data?: any) {
        return this.client.post<T>(url, data).then(res => res.data);
    }

    put<T>(url: string, data?: any) {
        return this.client.put<T>(url, data).then(res => res.data);
    }

    delete<T>(url: string) {
        return this.client.delete<T>(url).then(res => res.data);
    }
}
