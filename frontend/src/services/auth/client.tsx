import axios, { type AxiosInstance } from "axios";
import useAuthStore from "./store/auth.store";

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, withCredentials: true });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          try {
            useAuthStore.getState().clear();
          } catch {
            // ignore if store not available for some reason
          }

          // only redirect if not already on the login route to avoid reload loop
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string) {
    return this.client.get<T>(url).then((res) => res.data);
  }

  post<T>(url: string, data?: any) {
    return this.client.post<T>(url, data).then((res) => res.data);
  }

  put<T>(url: string, data?: any) {
    return this.client.put<T>(url, data).then((res) => res.data);
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url).then((res) => res.data);
  }
}
