import http from "./httpService";

const RESOURCE = "/upload";

export interface UploadResponse {
  url?: string;
  urls?: string[];
  [key: string]: unknown;
}

export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return http.post<UploadResponse>(RESOURCE, formData, {
    headers: { "content-type": "multipart/form-data" },
  });
};

export const uploadMultipleImage = (files: File[] | FileList) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  return http.post<UploadResponse>(`${RESOURCE}-multiple`, formData, {
    headers: { "content-type": "multipart/form-data" },
  });
};
