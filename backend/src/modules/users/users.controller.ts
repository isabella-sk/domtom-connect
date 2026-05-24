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
