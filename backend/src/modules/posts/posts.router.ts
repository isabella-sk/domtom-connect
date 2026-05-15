import { Router } from "express";
import * as ctrl from "./posts.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createPostSchema, updatePostSchema } from "./posts.schema";

export const postsRouter = Router();

postsRouter.get("/", authenticate, ctrl.getPosts);
postsRouter.get("/:id", authenticate, ctrl.getPostById);
postsRouter.post(
  "/",
  authenticate,
  validate(createPostSchema),
  ctrl.createPost,
);
postsRouter.patch(
  "/:id",
  authenticate,
  validate(updatePostSchema),
  ctrl.updatePost,
);
postsRouter.delete("/:id", authenticate, ctrl.deletePost);
