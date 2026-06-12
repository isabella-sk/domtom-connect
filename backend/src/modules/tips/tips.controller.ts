import { Request, Response, NextFunction } from "express";
import * as tipsService from "./tips.service";
import { prisma } from "../../config/database";

export const getTips = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const type = req.query.type as string | undefined;
    const tips = await tipsService.getApprovedTips(type);
    res.status(200).json(tips);
  } catch (err) {
    next(err);
  }
};

export const createTip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tip = await tipsService.createTip(req.body, req.userId!);
    res.status(201).json(tip);
  } catch (err) {
    next(err);
  }
};

export const deleteTip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tipId = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { isAdmin: true },
    });
    await tipsService.deleteTip(tipId, req.userId!, user?.isAdmin ?? false);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
