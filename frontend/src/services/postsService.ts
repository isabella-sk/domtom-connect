import api from "./api";

export interface PostAttachment {
  id: string;
  type: string;
  url: string;
  name: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; username: string; avatarUrl?: string };
  attachments: PostAttachment[];
}

export const postsService = {
  getAll: async (category?: string): Promise<Post[]> => {
    const params = category ? `?category=${category}` : "";
    const res = await api.get(`/posts${params}`);
    return res.data;
  },
  getById: async (id: string): Promise<Post> => {
    const res = await api.get(`/posts/${id}`);
    return res.data;
  },
  create: async (data: {
    title: string;
    content: string;
    category: string;
  }) => {
    const res = await api.post("/posts", data);
    return res.data;
  },
};
