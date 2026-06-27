import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { prisma } from "../../config/database";
import * as scamService from "../scam/scam.service";
import * as tipsService from "../tips/tips.service";
import * as postsService from "../posts/posts.service";
import { attachmentUpload } from "../../utils/cloudinary";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

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

// Stats
adminRouter.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [users, posts, tips, scams, verifiedScams, approvedTips] =
        await Promise.all([
          prisma.user.count(),
          prisma.post.count(),
          prisma.tip.count({ where: { isApproved: false } }),
          prisma.scamReport.count({ where: { status: "pending" } }),
          prisma.scamReport.count({ where: { status: "verified" } }),
          prisma.tip.count({ where: { isApproved: true } }),
        ]);
      res.json({
        users,
        posts,
        pendingTips: tips,
        pendingScams: scams,
        verifiedScams,
        approvedTips,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Arnaques
adminRouter.get(
  "/scam/pending",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await scamService.getPendingScams());
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.get(
  "/scam/all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scams = await prisma.scamReport.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, username: true } },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      res.json(scams);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/scam/:id/status",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!["verified", "rejected"].includes(status))
        return res.status(400).json({ message: "Statut invalide" });
      res.json(await scamService.updateScamStatus(req.params.id, status));
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/scam/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { title, description } = req.body;
      const data: Record<string, string> = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      const scam = await prisma.scamReport.update({
        where: { id: req.params.id },
        data,
        include: {
          reporter: { select: { id: true, username: true } },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      res.json(scam);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.delete(
  "/scam/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await prisma.scamReport.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── Tips ──────────────────────────────────────────────────────────────────────
adminRouter.get(
  "/tips/pending",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await tipsService.getPendingTips());
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.get(
  "/tips/all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tips = await prisma.tip.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, originTerritory: true },
          },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      res.json(tips);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/tips/:id/status",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { isApproved } = req.body;
      if (typeof isApproved !== "boolean")
        return res
          .status(400)
          .json({ message: "isApproved doit être un booléen" });
      res.json(await tipsService.updateTipStatus(req.params.id, isApproved));
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  "/tips/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { title, content: tipContent } = req.body;
      const data: Record<string, string> = {};
      if (title !== undefined) data.title = title;
      if (tipContent !== undefined) data.content = tipContent;
      const tip = await prisma.tip.update({
        where: { id: req.params.id },
        data,
        include: {
          author: {
            select: { id: true, username: true, originTerritory: true },
          },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      res.json(tip);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.delete(
  "/tips/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await prisma.tip.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── Guides (Posts) ────────────────────────────────────────────────────────────
adminRouter.get(
  "/posts",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await prisma.post.findMany({
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, username: true } },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
            orderBy: { createdAt: "asc" as const },
          },
        },
      });
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },
);

// POST /admin/posts — multipart/form-data (fichiers + liens optionnels)
adminRouter.post(
  "/posts",
  attachmentUpload.array("files", 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, category, isPinned, links: linksRaw } = req.body;
      const files = (req.files as Express.Multer.File[]) ?? [];
      const links = parseLinks(linksRaw);

      if (!title || title.trim().length < 5)
        return res
          .status(400)
          .json({ message: "Titre trop court (min 5 caractères)" });
      if (!content || content.trim().length < 20)
        return res
          .status(400)
          .json({ message: "Contenu trop court (min 20 caractères)" });
      const validCategories = [
        "logement",
        "caf",
        "sante",
        "banque",
        "transport",
        "telephone",
        "crous",
        "autre",
      ];
      if (!validCategories.includes(category))
        return res.status(400).json({ message: "Catégorie invalide" });

      const post = await postsService.createPost(
        {
          title: title.trim(),
          content: content.trim(),
          category,
          isPinned: isPinned === "true" || isPinned === true,
        },
        req.userId!,
        files,
        links,
      );
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /admin/posts/:id — multipart/form-data (champs scalaires + fichiers/liens optionnels)
adminRouter.patch(
  "/posts/:id",
  attachmentUpload.array("files", 5),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const links = parseLinks(req.body.links);

      // Construire uniquement les champs scalaires présents
      const scalarData: Record<string, unknown> = {};
      if (req.body.title !== undefined) scalarData.title = req.body.title;
      if (req.body.content !== undefined) scalarData.content = req.body.content;
      if (req.body.category !== undefined)
        scalarData.category = req.body.category;
      if (req.body.isPinned !== undefined) {
        scalarData.isPinned =
          req.body.isPinned === "true" || req.body.isPinned === true;
      }

      const post = await postsService.updatePost(
        req.params.id,
        scalarData,
        req.userId!,
        true,
        files,
        links,
      );
      res.json(post);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.delete(
  "/posts/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await postsService.deletePost(req.params.id, req.userId!, true);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── Attachments ───────────────────────────────────────────────────────────────
// DELETE /admin/attachments/:id — supprime un attachment individuel (image, document, lien)
adminRouter.delete(
  "/attachments/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      // On cherche l'attachment dans chaque table possible
      const postAtt = await prisma.postAttachment.findUnique({
        where: { id: req.params.id },
      });
      const tipAtt = !postAtt
        ? await prisma.tipAttachment.findUnique({
            where: { id: req.params.id },
          })
        : null;
      const scamAtt =
        !postAtt && !tipAtt
          ? await prisma.scamAttachment.findUnique({
              where: { id: req.params.id },
            })
          : null;

      const att = postAtt ?? tipAtt ?? scamAtt;
      if (!att)
        return res.status(404).json({ message: "Attachment introuvable" });

      // Supprimer le fichier Cloudinary si ce n'est pas un lien
      if (att.type !== "link") {
        const { deleteFromCloudinary } = await import("../../utils/cloudinary");
        await deleteFromCloudinary(att.url).catch(() => {});
      }

      // Supprimer en base selon la table
      if (postAtt) {
        // Récupérer la catégorie pour invalider le bon cache Redis
        const post = await prisma.post.findUnique({
          where: { id: postAtt.postId },
          select: { category: true },
        });
        await prisma.postAttachment.delete({ where: { id: req.params.id } });
        // Invalider le cache Redis posts
        const { redisClient } = await import("../../config/redis");
        await redisClient.del("cache:posts:all").catch(() => {});
        if (post?.category)
          await redisClient
            .del(`cache:posts:cat:${post.category}`)
            .catch(() => {});
      } else if (tipAtt) {
        await prisma.tipAttachment.delete({ where: { id: req.params.id } });
      } else if (scamAtt) {
        await prisma.scamAttachment.delete({ where: { id: req.params.id } });
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ── Utilisateurs ──────────────────────────────────────────────────────────────
adminRouter.get(
  "/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          originTerritory: true,
          currentCity: true,
          isAdmin: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { posts: true, tips: true, scamReports: true } },
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
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { isAdmin } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isAdmin: Boolean(isAdmin) },
        select: { id: true, username: true, isAdmin: true },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.delete(
  "/users/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      if (req.params.id === req.userId)
        return res
          .status(400)
          .json({ message: "Impossible de supprimer son propre compte" });
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
