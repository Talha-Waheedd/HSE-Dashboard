import { apiClient } from "./client";

export interface UploadProgress {
  loaded: number;
  total?: number;
  percent: number;
}

export const uploadClient = {
  upload: async (file: File, metadata: Record<string, unknown> = {}, onProgress?: (progress: UploadProgress) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(metadata).forEach(([key, value]) => formData.append(key, String(value)));
    return apiClient.post("/attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
      }),
    });
  },
};
