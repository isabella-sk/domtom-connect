import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";

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
