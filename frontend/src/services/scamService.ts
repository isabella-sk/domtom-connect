import api from "./api";

export interface ScamReport {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceNote?: string;
  createdAt: string;
}

export const scamService = {
  getAll: async (category?: string): Promise<ScamReport[]> => {
    const params = category ? `?category=${category}` : "";
    const res = await api.get(`/scam${params}`);
    return res.data;
  },

  getById: async (id: string): Promise<ScamReport> => {
    const res = await api.get(`/scam/${id}`);
    return res.data;
  },

  report: async (data: {
    title: string;
    description: string;
    category: string;
    sourceType?: string;
    sourceUrl?: string;
    sourceNote?: string;
  }): Promise<ScamReport> => {
    const res = await api.post("/scam", data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/scam/${id}`);
  },
};
