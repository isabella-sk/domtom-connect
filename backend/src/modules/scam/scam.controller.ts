import { Request, Response, NextFunction } from "express";
import * as scamService from "./scam.service";
import { prisma } from "../../config/database";
import { uploadAttachment } from "../../utils/cloudinary";
import { createScamSchema } from "./scam.schema";

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

export const getScams = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reporterId = req.query.reporterId as string | undefined;

    if (reporterId) {
      const scams = await prisma.scamReport.findMany({
        where: { reporterId },
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, username: true } },
          attachments: {
            select: { id: true, type: true, url: true, name: true },
          },
        },
      });
      return res.status(200).json(scams);
    }

    res
      .status(200)
      .json(
        await scamService.getScams(req.query.category as string | undefined),
      );
  } catch (err) {
    next(err);
  }
};

export const getScamById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json(await scamService.getScamById(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const createScam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];

    // Validation Zod — collecte TOUTES les erreurs en une seule passe
    const result = createScamSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { title, description, category, links: linksRaw } = result.data;
    const links = parseLinks(linksRaw);

    const report = await scamService.createScamReport(
      { title, description, category },
      req.userId!,
      files,
      links,
    );
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const updateScam = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scamId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    const scam = await prisma.scamReport.findUnique({ where: { id: scamId } });
    if (!scam)
      return res.status(404).json({ message: "Signalement introuvable" });
    if (scam.reporterId !== req.userId && !user?.isAdmin)
      return res.status(403).json({ message: "Non autorisé" });

    const files = (req.files as Express.Multer.File[]) ?? [];
    const links = parseLinks(req.body.links);

    const scalarData: Record<string, unknown> = {};
    if (req.body.title !== undefined) scalarData.title = req.body.title;
    if (req.body.description !== undefined)
      scalarData.description = req.body.description;
    if (req.body.category !== undefined)
      scalarData.category = req.body.category;

    const fileAttachments: {
      type: "image" | "document";
      url: string;
      name: string;
    }[] = [];
    for (const file of files) {
      const result = await uploadAttachment(file, "domtom-connect/scams");
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

    const updated = await prisma.scamReport.update({
      where: { id: scamId },
      data: {
        ...scalarData,
        ...(newAttachments.length > 0 && {
          attachments: { create: newAttachments },
        }),
      },
      include: {
        reporter: { select: { id: true, username: true } },
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

export const updateStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.body;
    if (!["verified", "rejected"].includes(status))
      return res.status(400).json({ message: "Statut invalide" });
    res
      .status(200)
      .json(await scamService.updateScamStatus(req.params.id, status));
  } catch (err) {
    next(err);
  }
};

export const deleteScam = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    await scamService.deleteScam(
      req.params.id,
      req.userId!,
      user?.isAdmin ?? false,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
