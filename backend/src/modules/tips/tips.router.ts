import { Router } from "express";
import * as ctrl from "./tips.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createTipSchema } from "./tips.schema";

export const tipsRouter = Router();

tipsRouter.get("/", authenticate, ctrl.getTips);
tipsRouter.post("/", authenticate, validate(createTipSchema), ctrl.createTip);
tipsRouter.delete("/:id", authenticate, ctrl.deleteTip);
