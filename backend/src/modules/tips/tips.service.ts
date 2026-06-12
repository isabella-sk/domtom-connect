import { prisma } from "../../config/database";
import type { CreateTipDto } from "./tips.schema";

export const getApprovedTips = async (type?: string) => {
  return prisma.tip.findMany({
    where: {
      isApproved: true,
      ...(type ? { type } : {}),
    },
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
    },
  });
};

export const createTip = async (data: CreateTipDto, authorId: string) => {
  return prisma.tip.create({
    data: { ...data, authorId },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
};

export const getPendingTips = async () => {
  return prisma.tip.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          originTerritory: true,
        },
      },
    },
  });
};

export const updateTipStatus = async (id: string, isApproved: boolean) => {
  const tip = await prisma.tip.findUnique({ where: { id } });
  if (!tip) throw { status: 404, message: "Tip introuvable" };
  return prisma.tip.update({ where: { id }, data: { isApproved } });
};

export const deleteTip = async (
  id: string,
  userId: string,
  isAdmin: boolean,
) => {
  const tip = await prisma.tip.findUnique({ where: { id } });
  if (!tip) throw { status: 404, message: "Tip introuvable" };
  if (tip.authorId !== userId && !isAdmin)
    throw { status: 403, message: "Non autorisé" };
  await prisma.tip.delete({ where: { id } });
};
