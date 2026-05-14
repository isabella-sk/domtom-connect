import { Router } from "express";
import * as ctrl from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { registerSchema, loginSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), ctrl.register);
authRouter.post("/login", validate(loginSchema), ctrl.login);
authRouter.post("/refresh", ctrl.refresh);
authRouter.post("/logout", authenticate, ctrl.logout);
authRouter.get("/me", authenticate, ctrl.getMe);
