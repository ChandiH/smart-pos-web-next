/* Common Interfaces */
export type API_RESPONSE<T> = {
  data: T;
  error?: any;
};

export type SortDirection = "asc" | "desc";
