import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("[Error]", err);
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.code === "P2002")
    return res.status(409).json({ message: "Ressource déjà existante" });
  return res.status(500).json({ message: "Erreur serveur interne" });
};
