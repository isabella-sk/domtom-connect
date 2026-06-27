import { Request, Response, NextFunction } from "express";
import * as tipsService from "./tips.service";
import { prisma } from "../../config/database";
import { uploadAttachment } from "../../utils/cloudinary";
import { createTipSchema } from "./tips.schema";

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

export const getTips = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const type = req.query.type as string | undefined;
    const authorId = req.query.authorId as string | undefined;

    // Si authorId fourni, on retourne TOUS les tips de cet auteur (approuvés ou non)
    if (authorId) {
      const tips = await prisma.tip.findMany({
        where: { authorId },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              originTerritory: true,
            },
          },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      return res.status(200).json(tips);
    }

    const tips = await tipsService.getTips(type);
    res.status(200).json(tips);
  } catch (err) {
    next(err);
  }
};

export const getTipById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tip = await tipsService.getTipById(req.params.id);
    res.status(200).json(tip);
  } catch (err) {
    next(err);
  }
};

export const createTip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = createTipSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    const links = parseLinks(req.body.links);

    const tip = await tipsService.createTip(
      result.data,
      req.userId!,
      files,
      links,
    );
    res.status(201).json(tip);
  } catch (err) {
    next(err);
  }
};

export const updateTip = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tipId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    const tip = await prisma.tip.findUnique({ where: { id: tipId } });
    if (!tip) return res.status(404).json({ message: "Contenu introuvable" });
    if (tip.authorId !== req.userId && !user?.isAdmin)
      return res.status(403).json({ message: "Non autorisé" });

    const files = (req.files as Express.Multer.File[]) ?? [];
    const links = parseLinks(req.body.links);

    // Champs scalaires
    const scalarData: Record<string, unknown> = {};
    if (req.body.title) scalarData.title = req.body.title;
    if (req.body.content) scalarData.content = req.body.content;

    // Upload nouveaux fichiers
    const fileAttachments: {
      type: "image" | "document";
      url: string;
      name: string;
    }[] = [];
    for (const file of files) {
      const result = await uploadAttachment(file, "domtom-connect/tips");
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

    const newAttachments = [...fileAttachments, ...linkAttachments];

    const updated = await prisma.tip.update({
      where: { id: tipId },
      data: {
        ...scalarData,
        ...(newAttachments.length > 0 && {
          attachments: { create: newAttachments },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            originTerritory: true,
          },
        },
        attachments: {
          select: { id: true, type: true, url: true, name: true },
        },
      },
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteTip = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    await tipsService.deleteTip(
      req.params.id,
      req.userId!,
      user?.isAdmin ?? false,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
