import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import type { CreatePostDto, UpdatePostDto } from "./posts.schema";

const CACHE_TTL = 60 * 60; //1h

const invalidatePostsCache = async (category?: string) => {
  await redisClient.del("cache:posts:all");
  if (category) await redisClient.del(`cache:posts:cat:${category}`);
};

export const getPosts = async (category?: string) => {
  const cacheKey = category ? `cache:posts:cat:${category}` : "cache:posts:all";

  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(posts));
  return posts;
};

export const getPostById = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  if (!post) throw { status: 404, message: "Guide introuvable" };
  return post;
};

export const createPost = async (data: CreatePostDto, authorId: string) => {
  const post = await prisma.post.create({
    data: { ...data, authorId },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  await invalidatePostsCache(data.category);
  return post;
};

export const updatePost = async (
  id: string,
  data: UpdatePostDto,
  userId: string,
  isAdmin: boolean,
) => {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: "Guide introuvable" };
  if (existing.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  const post = await prisma.post.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  await invalidatePostsCache(existing.category);
  return post;
};

export const deletePost = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: "Guide introuvable" };
  if (existing.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  await prisma.post.delete({ where: { id } });
  await invalidatePostsCache(existing.category);
};
