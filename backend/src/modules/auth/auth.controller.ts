import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

const COOKIE_OPT = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.register(req.body);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPT);
    res
      .status(201)
      .json({
        user: result.user,
        accessToken: result.accessToken,
        message: "Compte créé",
      });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.login(req.body);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPT);
    res
      .status(200)
      .json({
        user: result.user,
        accessToken: result.accessToken,
        message: "Connexion réussie",
      });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (!rt) return res.status(401).json({ message: "Refresh token manquant" });
    const result = await authService.refreshTokens(rt);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPT);
    res
      .status(200)
      .json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (rt && req.userId) await authService.logout(req.userId, rt);
    res.clearCookie("refreshToken", COOKIE_OPT);
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
