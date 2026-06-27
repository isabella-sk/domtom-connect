import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import type { CreatePostDto, UpdatePostDto } from "./posts.schema";
import { uploadAttachment, deleteFromCloudinary } from "../../utils/cloudinary";

const CACHE_TTL = 60 * 60; // 1h

const invalidatePostsCache = async (category?: string) => {
  await redisClient.del("cache:posts:all");
  if (category) await redisClient.del(`cache:posts:cat:${category}`);
};

// include réutilisable
const postInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  attachments: {
    select: { id: true, type: true, url: true, name: true },
    orderBy: { createdAt: "asc" as const },
  },
};

// GET ALL
export const getPosts = async (category?: string) => {
  const cacheKey = category ? `cache:posts:cat:${category}` : "cache:posts:all";

  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const posts = await prisma.post.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: postInclude,
  });

  await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(posts));
  return posts;
};

// GET BY ID
export const getPostById = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });
  if (!post) throw { status: 404, message: "Guide introuvable" };
  return post;
};

// CREATE
export const createPost = async (
  data: CreatePostDto,
  authorId: string,
  files: Express.Multer.File[] = [],
  links: { url: string; name?: string }[] = [],
) => {
  const fileAttachments: {
    type: "image" | "document";
    url: string;
    name: string;
  }[] = [];

  for (const file of files) {
    const result = await uploadAttachment(file, "domtom-connect/posts");
    fileAttachments.push({
      type: result.type,
      url: result.url,
      name: file.originalname,
    });
  }

  const linkAttachments = links.map((l) => ({
    type: "link" as const,
    url: l.url,
    name: l.name ?? l.url,
  }));

  const allAttachments = [...fileAttachments, ...linkAttachments];

  const post = await prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isPinned: data.isPinned ?? false,
      authorId,
      ...(allAttachments.length > 0 && {
        attachments: { create: allAttachments },
      }),
    },
    include: postInclude,
  });

  await invalidatePostsCache(data.category);
  return post;
};

// UPDATE — gère les champs scalaires + ajout de nouveaux fichiers/liens
export const updatePost = async (
  id: string,
  data: UpdatePostDto & Record<string, unknown>,
  userId: string,
  isAdmin: boolean,
  files: Express.Multer.File[] = [],
  links: { url: string; name?: string }[] = [],
) => {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw { status: 404, message: "Guide introuvable" };
  if (existing.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  // Champs scalaires à mettre à jour
  const scalarData: Record<string, unknown> = {};
  if (data.title !== undefined) scalarData.title = data.title;
  if (data.content !== undefined) scalarData.content = data.content;
  if (data.category !== undefined) scalarData.category = data.category;
  if (data.isPinned !== undefined) scalarData.isPinned = data.isPinned;

  // Upload nouveaux fichiers
  const fileAttachments: {
    type: "image" | "document";
    url: string;
    name: string;
  }[] = [];
  for (const file of files) {
    const result = await uploadAttachment(file, "domtom-connect/posts");
    fileAttachments.push({
      type: result.type,
      url: result.url,
      name: file.originalname,
    });
  }

  // Préparer nouveaux liens
  const linkAttachments = links.map((l) => ({
    type: "link" as const,
    url: l.url,
    name: l.name ?? l.url,
  }));

  const newAttachments = [...fileAttachments, ...linkAttachments];

  // Mise à jour atomique
  const post = await prisma.post.update({
    where: { id },
    data: {
      ...scalarData,
      ...(newAttachments.length > 0 && {
        attachments: { create: newAttachments },
      }),
    },
    include: postInclude,
  });

  await invalidatePostsCache(existing.category);
  if (data.category && data.category !== existing.category) {
    await invalidatePostsCache(data.category as string);
  }

  return post;
};

// DELETE
export const deletePost = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const existing = await prisma.post.findUnique({
    where: { id },
    include: { attachments: { select: { url: true, type: true } } },
  });
  if (!existing) throw { status: 404, message: "Guide introuvable" };
  if (existing.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  for (const att of existing.attachments) {
    if (att.type !== "link") {
      await deleteFromCloudinary(att.url).catch(() => {});
    }
  }

  await prisma.post.delete({ where: { id } });
  await invalidatePostsCache(existing.category);
};
