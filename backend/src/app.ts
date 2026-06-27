import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { adminRouter } from "./modules/admin/admin.router";
import { postsRouter } from "./modules/posts/posts.router";
import { scamRouter } from "./modules/scam/scam.router";
import { errorMiddleware } from "./middlewares/error.middleware";
import { chatRouter } from "./modules/chat/chat.router";
import { tipsRouter } from "./modules/tips/tips.router";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Trop de tentatives. Réessaie dans 1h." },
  // Désactivé en test : la suite dépasse facilement 10 req/h cumulées
  // (inscriptions + connexions dans différents it()), ce qui provoquerait
  // des 429 aléatoires sur des tests par ailleurs valides.
  skip: () => process.env.NODE_ENV === "test",
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsRouter);
app.use("/api/scam", scamRouter);
app.use("/api/chat", chatRouter);
app.use("/api/tips", tipsRouter);

app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

app.use(errorMiddleware);

export default app;
