import { Router } from "express";
import * as ctrl from "./users.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateProfileSchema } from "./users.schema";
import { avatarUpload } from "../../utils/cloudinary";

export const usersRouter = Router();

// Routes générales
usersRouter.get("/", authenticate, ctrl.getAllUsers);
usersRouter.get("/map", authenticate, ctrl.getMapUsers);
usersRouter.get("/nearby", authenticate, ctrl.getNearbyUsers);

// Routes "me" (avant /:id pour éviter conflit de routing)
usersRouter.get("/me", authenticate, ctrl.getMe);
usersRouter.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  ctrl.updateProfile,
);
usersRouter.post(
  "/me/avatar",
  authenticate,
  avatarUpload.single("avatar"), // "avatar" = nom du champ multipart
  ctrl.uploadAvatar,
);

// Routes par ID
usersRouter.get("/:id", authenticate, ctrl.getUserProfile);
usersRouter.get("/:id/followers", authenticate, ctrl.getFollowers);
usersRouter.get("/:id/following", authenticate, ctrl.getFollowing);
usersRouter.post("/:id/follow", authenticate, ctrl.followUser);
usersRouter.delete("/:id/follow", authenticate, ctrl.unfollowUser);
