import { apiClient } from './apiClient';

export interface Plant {
  id: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const plantService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/plants', { params });
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get('/plants/active');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/plants/${id}`);
    return response.data;
  },

  create: async (data: Partial<Plant>) => {
    const response = await apiClient.post('/plants', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Plant>) => {
    const response = await apiClient.put(`/plants/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/plants/${id}`);
    return response.data;
  }
};
