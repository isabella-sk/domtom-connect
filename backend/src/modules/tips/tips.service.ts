import { prisma } from "../../config/database";
import { uploadAttachment, deleteFromCloudinary } from "../../utils/cloudinary";

export const getTips = async (type?: string) => {
  return prisma.tip.findMany({
    where: { isApproved: true, ...(type ? { type } : {}) },
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
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const getTipById = async (id: string) => {
  const tip = await prisma.tip.findUnique({
    where: { id, isApproved: true },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          originTerritory: true,
        },
      },
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
  if (!tip) throw { status: 404, message: "Contenu introuvable" };
  return tip;
};

export const getPendingTips = async () => {
  return prisma.tip.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, originTerritory: true } },
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const createTip = async (
  data: { title: string; content: string; type: string },
  authorId: string,
  files: Express.Multer.File[],
  links: { url: string; name?: string }[],
) => {
  const fileAttachments = await Promise.all(
    files.map(async (file) => {
      const { url, type } = await uploadAttachment(file, "domtom-connect/tips");
      return { type, url, name: file.originalname };
    }),
  );

  const linkAttachments = links.map((l) => ({
    type: "link" as const,
    url: l.url,
    name: l.name || l.url,
  }));

  const allAttachments = [...fileAttachments, ...linkAttachments];

  return prisma.tip.create({
    data: {
      ...data,
      authorId,
      attachments:
        allAttachments.length > 0 ? { create: allAttachments } : undefined,
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
      attachments: { select: { id: true, type: true, url: true, name: true } },
    },
  });
};

export const updateTipStatus = async (id: string, isApproved: boolean) => {
  const tip = await prisma.tip.findUnique({ where: { id } });
  if (!tip) throw { status: 404, message: "Contenu introuvable" };
  return prisma.tip.update({
    where: { id },
    data: { isApproved },
    select: { id: true, title: true, isApproved: true },
  });
};

export const deleteTip = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const tip = await prisma.tip.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!tip) throw { status: 404, message: "Contenu introuvable" };
  if (tip.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };

  await Promise.all(
    tip.attachments
      .filter((a: (typeof tip.attachments)[number]) => a.type !== "link")
      .map((a: (typeof tip.attachments)[number]) =>
        deleteFromCloudinary(a.url),
      ),
  );

  await prisma.tip.delete({ where: { id } });
};
