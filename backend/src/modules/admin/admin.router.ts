import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { prisma } from "../../config/database";
import * as scamService from "../scam/scam.service";
import * as tipsService from "../tips/tips.service";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

// Stats globales
adminRouter.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [users, posts, tips, scams] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.tip.count({ where: { isApproved: false } }),
        prisma.scamReport.count({ where: { status: "pending" } }),
      ]);
      res.json({ users, posts, pendingTips: tips, pendingScams: scams });
    } catch (err) {
      next(err);
    }
  },
);

// Gestion arnaques
adminRouter.get(
  "/scam/pending",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await scamService.getPendingScams();
      res.json(reports);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/scam/:id/status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!["verified", "rejected"].includes(status))
        return res.status(400).json({ message: "Statut invalide" });
      const report = await scamService.updateScamStatus(
        req.params.id as string,
        status,
      );
      res.json(report);
    } catch (err) {
      next(err);
    }
  },
);

// Gestion tips
adminRouter.get(
  "/tips/pending",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tips = await tipsService.getPendingTips();
      res.json(tips);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/tips/:id/status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean")
        return res
          .status(400)
          .json({ message: "isApproved doit être un booléen" });
      const tip = await tipsService.updateTipStatus(
        req.params.id as string,
        isApproved,
      );
      res.json(tip);
    } catch (err) {
      next(err);
    }
  },
);

// Gestion utilisateurs
adminRouter.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          originTerritory: true,
          isAdmin: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/users/:id/admin",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isAdmin } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: { isAdmin: Boolean(isAdmin) },
        select: { id: true, username: true, isAdmin: true },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);
