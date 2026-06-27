import { Router } from "express";
import * as ctrl from "./scam.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { attachmentUpload } from "../../utils/cloudinary";

export const scamRouter = Router();

scamRouter.get("/", authenticate, ctrl.getScams);
scamRouter.get("/:id", authenticate, ctrl.getScamById);
scamRouter.post(
  "/",
  authenticate,
  attachmentUpload.array("files", 5),
  ctrl.createScam,
);
// /:id/status DOIT être avant /:id sinon Express match "status" comme un id
// requireAdmin ajouté : seul un admin peut vérifier/rejeter un signalement
scamRouter.patch("/:id/status", authenticate, requireAdmin, ctrl.updateStatus);
scamRouter.patch(
  "/:id",
  authenticate,
  attachmentUpload.array("files", 5),
  ctrl.updateScam,
);
scamRouter.delete("/:id", authenticate, ctrl.deleteScam);
