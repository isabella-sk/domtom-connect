import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "Token d'authentification manquant" });

  const token = auth.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "Token expiré", code: "TOKEN_EXPIRED" });
    return res.status(401).json({ message: "Token invalide" });
  }
};
