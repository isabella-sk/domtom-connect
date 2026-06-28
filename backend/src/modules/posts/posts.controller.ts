import { Request, Response, NextFunction } from "express";
import * as postsService from "./posts.service";
import { prisma } from "../../config/database";
import { createPostSchema } from "./posts.schema";

// Helper : parser le JSON des liens envoyé en FormData
const parseLinks = (raw: unknown): { url: string; name?: string }[] => {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is { url: string; name?: string } =>
        typeof l === "object" && l !== null && typeof l.url === "string",
    );
  } catch {
    return [];
  }
};

// GET ALL
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = req.query.category as string | undefined;
    const posts = await postsService.getPosts(category);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

// GET BY ID
export const getPostById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const post = await postsService.getPostById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

// CREATE (multipart/form-data)
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];

    // Validation Zod - collecte TOUTES les erreurs en une seule passe
    const result = createPostSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { title, content, category, isPinned } = result.data;
    const links = parseLinks(req.body.links);

    const post = await postsService.createPost(
      { title, content, category, isPinned },
      req.userId!,
      files,
      links,
    );
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

// UPDATE (multipart/form-data ou JSON)
export const updatePost = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });

    const files = (req.files as Express.Multer.File[]) ?? [];
    const links = parseLinks(req.body.links);

    // Normaliser isPinned qu'il arrive en string (FormData) ou boolean (JSON)
    const body: Record<string, unknown> = { ...req.body };
    if ("isPinned" in body) {
      body.isPinned = body.isPinned === "true" || body.isPinned === true;
    }
    // Supprimer "links" du body — c'est géré séparément
    delete body.links;

    const post = await postsService.updatePost(
      req.params.id,
      body,
      req.userId!,
      user?.isAdmin ?? false,
      files,
      links,
    );
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

// DELETE
export const deletePost = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });

    await postsService.deletePost(
      req.params.id,
      req.userId!,
      user?.isAdmin ?? false,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
