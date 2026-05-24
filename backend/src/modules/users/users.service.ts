import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import type { UpdateProfileDto } from "./users.schema";

const CACHE_KEY = "cache:users:all";
const CACHE_TTL = 300; // 5 min

export const getAllUsers = async () => {
  const cached = await redisClient.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      originTerritory: true,
      currentCity: true,
      latitude: true,
      longitude: true,
      showOnMap: true,
    },
  });

  await redisClient.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(users));
  return users;
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      originTerritory: true,
      currentCity: true,
      createdAt: true,
    },
  });
  if (!user) throw { status: 404, message: "Utilisateur introuvable" };
  return user;
};

export const updateProfile = async (userId: string, data: UpdateProfileDto) => {
  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: userId } },
    });
    if (existing)
      throw { status: 409, message: "Ce nom d'utilisateur est déjà pris" };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      originTerritory: true,
      currentCity: true,
      showOnMap: true,
    },
  });

  await redisClient.del(CACHE_KEY);
  return user;
};
