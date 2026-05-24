import { Request, Response, NextFunction } from "express";
import * as chatService from "./chat.service";

export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const convs = await chatService.getConversations(req.userId!);
    res.status(200).json(convs);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const msgs = await chatService.getMessages(
      req.params.id,
      req.userId!,
      page,
    );
    res.status(200).json(msgs);
  } catch (err) {
    next(err);
  }
};

export const createPrivateConv = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const conv = await chatService.createPrivateConversation(
      req.userId!,
      req.body.targetUserId,
    );
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
};

export const createGroupConv = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const conv = await chatService.createGroupConversation(
      req.body.name,
      req.userId!,
      req.body.memberIds,
    );
    res.status(201).json(conv);
  } catch (err) {
    next(err);
  }
};
