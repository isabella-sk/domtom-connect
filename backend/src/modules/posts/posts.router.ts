import { Router } from "express";
import * as ctrl from "./posts.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { attachmentUpload } from "../../utils/cloudinary";

export const postsRouter = Router();

// Lecture - tout utilisateur authentifié
postsRouter.get("/", authenticate, ctrl.getPosts);
postsRouter.get("/:id", authenticate, ctrl.getPostById);

// Création - admin uniquement + multipart
postsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  attachmentUpload.array("files", 5),
  ctrl.createPost,
);

// Mise à jour - admin uniquement + multipart (pour fichiers/liens optionnels)
postsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  attachmentUpload.array("files", 5),
  ctrl.updatePost,
);

// Suppression - admin ou auteur
postsRouter.delete("/:id", authenticate, ctrl.deletePost);
