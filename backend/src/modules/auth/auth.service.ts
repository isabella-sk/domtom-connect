import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import type { RegisterDto, LoginDto } from "./auth.schema";

const BCRYPT_ROUNDS = 12;
const REFRESH_TTL = 7 * 24 * 60 * 60;

const sanitize = (user: any) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

const saveRefreshToken = async (token: string, userId: string) => {
  const expiresAt = new Date(Date.now() + REFRESH_TTL * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  await redisClient.setex(`refresh:${userId}`, REFRESH_TTL, token);
};

export const register = async (data: RegisterDto) => {
  const emailExists = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (emailExists) throw { status: 409, message: "Cet email est déjà utilisé" };

  const userExists = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (userExists)
    throw { status: 409, message: "Ce nom d'utilisateur est déjà pris" };

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      originTerritory: data.originTerritory,
    },
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await saveRefreshToken(refreshToken, user.id);

  return { user: sanitize(user), accessToken, refreshToken };
};

export const login = async (data: LoginDto) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw { status: 401, message: "Email ou mot de passe incorrect" };

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid)
    throw { status: 401, message: "Email ou mot de passe incorrect" };

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await saveRefreshToken(refreshToken, user.id);

  return { user: sanitize(user), accessToken, refreshToken };
};

export const refreshTokens = async (refreshToken: string) => {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: "Refresh token invalide ou expiré" };
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored) {
    await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
    throw { status: 401, message: "Refresh token révoqué" };
  }

  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  await redisClient.del(`refresh:${payload.userId}`);

  const newAccessToken = generateAccessToken(payload.userId);
  const newRefreshToken = generateRefreshToken(payload.userId);
  await saveRefreshToken(newRefreshToken, payload.userId);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw { status: 401, message: "Utilisateur introuvable" };

  return {
    user: sanitize(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (userId: string, refreshToken: string) => {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  await redisClient.del(`refresh:${userId}`);
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      bio: true,
      originTerritory: true,
      currentCity: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  if (!user) throw { status: 404, message: "Utilisateur introuvable" };
  return user;
};
