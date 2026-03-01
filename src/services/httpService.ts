import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND ?? "";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || undefined,
});

const shouldLogout = (data: unknown): boolean => {
  if (!data || typeof data !== "object") {
    return false;
  }
  const payload = data as { error?: string; logout?: boolean };
  return payload.logout === true || payload.error === "TOKEN_EXPIRED";
};

const performLogout = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("token");
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headerValue = token ?? "";

  if (config.headers instanceof AxiosHeaders) {
    if (!config.headers.has("x-access-token")) {
      config.headers.set("x-access-token", headerValue);
    }
  } else {
    const headers = (config.headers ?? {}) as Record<string, string>;
    if (!("x-access-token" in headers)) {
      headers["x-access-token"] = headerValue;
    }
    config.headers = new AxiosHeaders(headers);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (shouldLogout(response.data)) {
      performLogout();
      return Promise.reject(
        new AxiosError(
          "Token expired",
          "TOKEN_EXPIRED",
          response.config,
          response.request,
          response
        )
      );
    }

    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const isExpectedError = status >= 400 && status < 500;

    if (shouldLogout(error.response?.data)) {
      performLogout();
    }

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
  ): Promise<AxiosResponse<T>> =>
    apiClient.post<T>(url, data, config),

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
