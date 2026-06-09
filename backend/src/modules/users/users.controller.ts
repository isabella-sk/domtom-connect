import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";
import { prisma } from "../../config/database";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.id as string;
    const user = await usersService.getUserById(userId);
    res.status(200).json(user);
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
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const profile = await usersService.getUserProfile(
      req.params.id as string,
      req.userId!,
    );
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await usersService.followUser(
      req.userId!,
      req.params.id as string,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await usersService.unfollowUser(
      req.userId!,
      req.params.id as string,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const followers = await usersService.getFollowers(req.params.id as string);
    res.status(200).json(followers);
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const following = await usersService.getFollowing(req.params.id as string);
    res.status(200).json(following);
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
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        originTerritory: true,
        currentCity: true,
        showOnMap: true,
        latitude: true,
        longitude: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true, posts: true },
        },
      },
    });
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });
    res.status(200).json(user);
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
    if (!req.file) return res.status(400).json({ message: "Image requise" });
    const user = await usersService.uploadAvatar(req.userId!, req.file);
    res.status(200).json(user);
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
      return res.status(400).json({ message: "lat et lng sont requis" });
    const users = await usersService.getNearbyUsers(lat, lng, radius);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getMapUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await usersService.getMapUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};
