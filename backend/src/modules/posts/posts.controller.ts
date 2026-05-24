import { Request, Response, NextFunction } from "express";
import * as postsService from "./posts.service";

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

export const getPostById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.id as string; // ← FIX
    const post = await postsService.getPostById(postId);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const post = await postsService.createPost(req.body, req.userId!);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.id as string; // ← FIX

    const user = await import("../../config/database").then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.userId! },
        select: { isAdmin: true },
      }),
    );

    const post = await postsService.updatePost(
      postId,
      req.body,
      req.userId!,
      user?.isAdmin ?? false,
    );

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.id as string; // ← FIX

    const user = await import("../../config/database").then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.userId! },
        select: { isAdmin: true },
      }),
    );

    await postsService.deletePost(postId, req.userId!, user?.isAdmin ?? false);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
