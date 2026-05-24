import { Router } from "express";
import * as ctrl from "./scam.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createScamSchema } from "./scam.schema";

export const scamRouter = Router();

scamRouter.get("/", authenticate, ctrl.getScams);
scamRouter.post("/", authenticate, validate(createScamSchema), ctrl.createScam);
scamRouter.patch("/:id/status", authenticate, ctrl.updateStatus);
