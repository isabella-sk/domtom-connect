import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await usersService.getAllUsers());
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
    const user = await usersService.getUserProfile(req.userId!, req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.getUserProfile(req.params.id, req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await usersService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Aucun fichier fourni" });
    const user = await usersService.uploadAvatar(req.userId!, req.file);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Champs manquants" });
    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Le mot de passe doit faire au moins 8 caractères" });
    const result = await usersService.changePassword(
      req.userId!,
      currentPassword,
      newPassword,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await usersService.deleteAccount(req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Carte — passe currentUserId pour filtrer selon mapVisibility
export const getMapUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await usersService.getMapUsers(req.userId!);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getNearbyUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 50;
    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ message: "Coordonnées invalides" });
    const users = await usersService.getNearbyUsers(lat, lng, radius);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await usersService.getFollowers(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(await usersService.getFollowing(req.params.id));
  } catch (err) {
    next(err);
  }
};

export const followUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await usersService.followUser(req.userId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const unfollowUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await usersService.unfollowUser(req.userId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
