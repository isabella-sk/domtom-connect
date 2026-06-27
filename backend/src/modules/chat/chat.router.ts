import { Router } from "express";
import * as ctrl from "./chat.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createPrivateConvSchema, createGroupConvSchema } from "./chat.schema";

export const chatRouter = Router();

chatRouter.get("/conversations", authenticate, ctrl.getConversations);
chatRouter.get("/conversations/:id/messages", authenticate, ctrl.getMessages);
chatRouter.post(
  "/conversations/private",
  authenticate,
  validate(createPrivateConvSchema),
  ctrl.createPrivateConv,
);
chatRouter.post(
  "/conversations/group",
  authenticate,
  validate(createGroupConvSchema),
  ctrl.createGroupConv,
);
chatRouter.delete("/conversations/:id", authenticate, ctrl.deleteConversation);
chatRouter.delete(
  "/conversations/:id/messages/:messageId",
  authenticate,
  ctrl.deleteMessage,
);
