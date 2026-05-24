import { prisma } from "../../config/database";
import type { CreateScamDto } from "./scam.schema";

export const getScams = async (category?: string) => {
  return prisma.scamReport.findMany({
    where: {
      status: "verified",
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      // NE PAS exposer le reporterId (anonymat)
    },
  });
};

export const getPendingScams = async () => {
  return prisma.scamReport.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, username: true } },
    },
  });
};

export const createScamReport = async (
  data: CreateScamDto,
  reporterId: string,
) => {
  return prisma.scamReport.create({
    data: { ...data, reporterId },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
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
