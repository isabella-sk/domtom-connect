import { prisma } from "../../config/database";
import { uploadAttachment, deleteFromCloudinary } from "../../utils/cloudinary";

export const getScams = async (category?: string) => {
  return prisma.scamReport.findMany({
    where: { status: "verified", ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const getScamById = async (id: string) => {
  const report = await prisma.scamReport.findUnique({
    where: { id, status: "verified" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
  if (!report) throw { status: 404, message: "Signalement introuvable" };
  return report;
};

export const getPendingScams = async () => {
  return prisma.scamReport.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, username: true } },
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const createScamReport = async (
  data: { title: string; description: string; category: string },
  reporterId: string,
  files: Express.Multer.File[],
  links: { url: string; name?: string }[],
) => {
  // 1. Upload des fichiers sur Cloudinary
  const fileAttachments = await Promise.all(
    files.map(async (file) => {
      const { url, type } = await uploadAttachment(
        file,
        "domtom-connect/scams",
      );
      return { type, url, name: file.originalname };
    }),
  );

  // 2. Les liens sont stockés directement (pas d'upload)
  const linkAttachments = links.map((l) => ({
    type: "link" as const,
    url: l.url,
    name: l.name || l.url,
  }));

  const allAttachments = [...fileAttachments, ...linkAttachments];

  // 3. Création avec nested write (transaction implicite prisma)
  return prisma.scamReport.create({
    data: {
      ...data,
      reporterId,
      attachments:
        allAttachments.length > 0 ? { create: allAttachments } : undefined,
    },
    include: {
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const updateScamStatus = async (
  id: string,
  status: "verified" | "rejected",
) => {
  const report = await prisma.scamReport.findUnique({ where: { id } });
  if (!report) throw { status: 404, message: "Signalement introuvable" };
  return prisma.scamReport.update({
    where: { id },
    data: { status },
    select: { id: true, title: true, status: true },
  });
};

export const deleteScam = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const report = await prisma.scamReport.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!report) throw { status: 404, message: "Signalement introuvable" };
  if (report.reporterId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  // Supprimer les fichiers Cloudinary
  await Promise.all(
    report.attachments
      .filter((a: (typeof report.attachments)[number]) => a.type !== "link")
      .map((a: (typeof report.attachments)[number]) =>
        deleteFromCloudinary(a.url),
      ),
  );

  await prisma.scamReport.delete({ where: { id } });
};
