import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return res
      .status(403)
      .json({ message: "Accès réservé aux administrateurs" });
  }

  next();
};
