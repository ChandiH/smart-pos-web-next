import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND ?? "";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const isExpectedError = status >= 400 && status < 500;

    if (!isExpectedError) {
      console.error("Unexpected API error", error);
    }

    return Promise.reject(error);
  }
);

const http = {
  get: <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiClient.get<T>(url, config),

  post: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data, config),

  put: <T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data, config),

  delete: <T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<AxiosResponse<T>> => apiClient.delete<T>(url, config),
};

export type { AxiosResponse as HttpResponse, AxiosError as HttpError };
export type HttpRequestConfig<T = unknown> = AxiosRequestConfig<T>;
export { apiClient };
export default http;
