import { Request, Response, NextFunction } from "express";
import * as scamService from "./scam.service";

export const getScams = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = req.query.category as string | undefined;
    const scams = await scamService.getScams(category);
    res.status(200).json(scams);
  } catch (err) {
    next(err);
  }
};

export const createScam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await scamService.createScamReport(req.body, req.userId!);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const scamId = req.params.id as string; // ← FIX
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status))
      return res.status(400).json({ message: "Statut invalide" });

    const report = await scamService.updateScamStatus(scamId, status);
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};
