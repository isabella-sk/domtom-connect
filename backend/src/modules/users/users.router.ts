import { Router, Request, Response, NextFunction } from "express";
import * as ctrl from "./users.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateProfileSchema } from "./users.schema";
import { avatarUpload, deleteFromCloudinary } from "../../utils/cloudinary";
import { prisma } from "../../config/database";

export const usersRouter = Router();

// Routes générales
usersRouter.get("/", authenticate, ctrl.getAllUsers);
usersRouter.get("/map", authenticate, ctrl.getMapUsers);
usersRouter.get("/nearby", authenticate, ctrl.getNearbyUsers);

// Routes "me" — avant /:id pour éviter conflit de routing
usersRouter.get("/me", authenticate, ctrl.getMe);
usersRouter.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  ctrl.updateProfile,
);
usersRouter.post(
  "/me/avatar",
  authenticate,
  avatarUpload.single("avatar"),
  ctrl.uploadAvatar,
);
usersRouter.patch("/me/password", authenticate, ctrl.changePassword);
usersRouter.delete("/me", authenticate, ctrl.deleteAccount);

// ── DELETE attachment — accessible aux users normaux (ownership vérifié) ──────
usersRouter.delete(
  "/me/attachments/:attachmentId",
  authenticate,
  async (
    req: Request<{ attachmentId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const attId = req.params.attachmentId;
      const userId = req.userId!;

      // Chercher dans tip_attachments avec le tip pour vérifier l'ownership
      const tipAtt = await prisma.tipAttachment.findUnique({
        where: { id: attId },
      });
      if (tipAtt) {
        const tip = await prisma.tip.findUnique({
          where: { id: tipAtt.tipId },
          select: { authorId: true },
        });
        if (!tip || tip.authorId !== userId)
          return res.status(403).json({ message: "Non autorisé" });
        if (tipAtt.type !== "link")
          await deleteFromCloudinary(tipAtt.url).catch(() => {});
        await prisma.tipAttachment.delete({ where: { id: attId } });
        return res.status(204).send();
      }

      // Chercher dans scam_attachments avec le scam pour vérifier l'ownership
      const scamAtt = await prisma.scamAttachment.findUnique({
        where: { id: attId },
      });
      if (scamAtt) {
        const scam = await prisma.scamReport.findUnique({
          where: { id: scamAtt.scamReportId },
          select: { reporterId: true },
        });
        if (!scam || scam.reporterId !== userId)
          return res.status(403).json({ message: "Non autorisé" });
        if (scamAtt.type !== "link")
          await deleteFromCloudinary(scamAtt.url).catch(() => {});
        await prisma.scamAttachment.delete({ where: { id: attId } });
        return res.status(204).send();
      }

      return res.status(404).json({ message: "Attachment introuvable" });
    } catch (err) {
      next(err);
    }
  },
);

// Routes par ID
usersRouter.get("/:id", authenticate, ctrl.getUserProfile);
usersRouter.get("/:id/followers", authenticate, ctrl.getFollowers);
usersRouter.get("/:id/following", authenticate, ctrl.getFollowing);
usersRouter.post("/:id/follow", authenticate, ctrl.followUser);
usersRouter.delete("/:id/follow", authenticate, ctrl.unfollowUser);
