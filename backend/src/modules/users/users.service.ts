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

// Profil complet avec compteurs et isFollowing
export const getUserProfile = async (
  targetId: string,
  currentUserId: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      originTerritory: true,
      currentCity: true,
      showOnMap: true,
      createdAt: true,
      _count: {
        select: {
          followers: true, // combien de gens le suivent
          following: true, // combien de gens il suit
          posts: true, // ses publications
        },
      },
    },
  });
  if (!user) throw { status: 404, message: "Utilisateur introuvable" };

  // Est-ce que le currentUser suit déjà cet user ?
  const isFollowing =
    currentUserId === targetId
      ? false
      : !!(await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: targetId,
            },
          },
        }));

  return { ...user, isFollowing };
};

// Suivre un utilisateur
export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId)
    throw { status: 400, message: "Tu ne peux pas te suivre toi-même" };

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw { status: 404, message: "Utilisateur introuvable" };

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) throw { status: 409, message: "Tu suis déjà cet utilisateur" };

  await prisma.follow.create({ data: { followerId, followingId } });
  return { message: "Abonnement effectué" };
};

// Ne plus suivre un utilisateur
export const unfollowUser = async (followerId: string, followingId: string) => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!existing)
    throw { status: 404, message: "Tu ne suis pas cet utilisateur" };

  await prisma.follow.delete({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return { message: "Désabonnement effectué" };
};

// Liste des abonnés (gens qui me suivent)
export const getFollowers = async (userId: string) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          originTerritory: true,
          currentCity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.follower);
};

// Liste des abonnements (gens que je suis)
export const getFollowing = async (userId: string) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          originTerritory: true,
          currentCity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.following);
};
