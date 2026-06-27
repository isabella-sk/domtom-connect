import { Router } from "express";
import * as ctrl from "./tips.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { attachmentUpload } from "../../utils/cloudinary";

export const tipsRouter = Router();

tipsRouter.get("/", authenticate, ctrl.getTips);
tipsRouter.get("/:id", authenticate, ctrl.getTipById);
tipsRouter.post(
  "/",
  authenticate,
  attachmentUpload.array("files", 5),
  ctrl.createTip,
);
// PATCH avec multer pour supporter nouveaux fichiers/liens
tipsRouter.patch(
  "/:id",
  authenticate,
  attachmentUpload.array("files", 5),
  ctrl.updateTip,
);
tipsRouter.delete("/:id", authenticate, ctrl.deleteTip);
