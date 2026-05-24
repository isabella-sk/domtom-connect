import { Router } from "express";
import * as ctrl from "./users.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateProfileSchema } from "./users.schema";

export const usersRouter = Router();

usersRouter.get("/", authenticate, ctrl.getAllUsers);
usersRouter.get("/:id", authenticate, ctrl.getUserById);
usersRouter.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  ctrl.updateProfile,
);
