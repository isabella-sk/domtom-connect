import api from "./api";

export interface ScamReport {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}

export const scamService = {
  getAll: async (category?: string): Promise<ScamReport[]> => {
    const params = category ? `?category=${category}` : "";
    const res = await api.get(`/scam${params}`);
    return res.data;
  },
  report: async (data: {
    title: string;
    description: string;
    category: string;
  }) => {
    const res = await api.post("/scam", data);
    return res.data;
  },
};
