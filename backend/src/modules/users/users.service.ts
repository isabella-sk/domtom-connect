import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import type { UpdateProfileDto } from "./users.schema";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { geocodeCity } from "../../services/geocoding.service";
import bcrypt from "bcrypt";

const CACHE_KEY = "cache:users:all";
const CACHE_TTL = 300;

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

  const updateData: UpdateProfileDto = { ...data };

  // Géocodage automatique
  // On regéocode si :
  //  (a) la ville change, ou
  //  (b) l'utilisateur active showOnMap et n'a pas encore de coordonnées
  const isActivatingMap = data.showOnMap === true;
  const isChangingCity = data.currentCity !== undefined;

  if (isActivatingMap || isChangingCity) {
    // On récupère l'état actuel pour savoir quelle ville géocoder
    // et si des coordonnées existent déjà
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentCity: true, latitude: true, longitude: true },
    });
    if (!current) throw { status: 404, message: "Utilisateur introuvable" };

    const cityToGeocode = data.currentCity ?? current.currentCity;
    const alreadyHasCoords =
      current.latitude !== null && current.longitude !== null;

    // On géocode si la ville a changé, ou si on active la carte sans coordonnées
    const needsGeocoding =
      isChangingCity || (isActivatingMap && !alreadyHasCoords);

    if (needsGeocoding) {
      if (!cityToGeocode) {
        if (isActivatingMap) {
          throw {
            status: 400,
            message:
              "Renseigne ta ville actuelle pour apparaître sur la carte.",
          };
        }
        // Si on vide la ville (currentCity: null), on efface aussi les coordonnées
        updateData.latitude = null;
        updateData.longitude = null;
      } else {
        const coords = await geocodeCity(cityToGeocode);
        if (!coords) {
          throw {
            status: 400,
            message:
              "Impossible de localiser cette ville. Vérifie l'orthographe (ex: 'Fort-de-France', 'Saint-Denis').",
          };
        }
        updateData.latitude = coords.latitude;
        updateData.longitude = coords.longitude;
      }
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      originTerritory: true,
      currentCity: true,
      latitude: true,
      longitude: true,
      showOnMap: true,
      mapVisibility: true,
    },
  });

  await redisClient.del(CACHE_KEY);
  return user;
};

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
      mapVisibility: true,
      createdAt: true,
      _count: {
        select: { followers: true, following: true, posts: true },
      },
    },
  });
  if (!user) throw { status: 404, message: "Utilisateur introuvable" };

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

type NearbyUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  originTerritory: string;
  currentCity: string | null;
  latitude: number;
  longitude: number;
  distance: number;
};

export const getNearbyUsers = async (
  lat: number,
  lng: number,
  radius = 50,
): Promise<NearbyUser[]> => {
  return prisma.$queryRaw<NearbyUser[]>`
    SELECT id, username, "avatarUrl", "originTerritory", "currentCity", latitude, longitude,
      (6371 * acos(LEAST(1.0,
        cos(radians(${lat})) * cos(radians(latitude))
        * cos(radians(longitude) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(latitude))
      ))) AS distance
    FROM users
    WHERE "showOnMap" = true AND latitude IS NOT NULL AND longitude IS NOT NULL
      AND (6371 * acos(LEAST(1.0,
        cos(radians(${lat})) * cos(radians(latitude))
        * cos(radians(longitude) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(latitude))
      ))) < ${radius}
    ORDER BY distance LIMIT 100
  `;
};

// Carte : filtre showOnMap et mapVisibility
export const getMapUsers = async (currentUserId: string) => {
  // Récupérer tous les users avec showOnMap = true et coordonnées
  const allMapUsers = await prisma.user.findMany({
    where: {
      showOnMap: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      originTerritory: true,
      currentCity: true,
      latitude: true,
      longitude: true,
      mapVisibility: true,
    },
  });

  // Récupérer les IDs des gens que currentUser suit (pour filtrer "followers only")
  const followingIds = new Set(
    (
      await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      })
    ).map((f) => f.followingId),
  );

  // Filtrer selon mapVisibility
  return allMapUsers
    .filter((u) => {
      if (u.id === currentUserId) return true; // toujours se voir soi-même
      if (u.mapVisibility === "everyone") return true;
      if (u.mapVisibility === "followers") return followingIds.has(u.id);
      // "none" → ne pas afficher
      return false;
    })
    .map(({ mapVisibility: _mv, ...rest }) => rest); // ne pas exposer mapVisibility
};

export const uploadAvatar = async (
  userId: string,
  file: Express.Multer.File,
) => {
  const url = await uploadToCloudinary(file);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
    select: { id: true, avatarUrl: true },
  });

  // Invalide le cache users
  await redisClient.del(CACHE_KEY);

  return user;
};

// Changer le mot de passe
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw { status: 404, message: "Utilisateur introuvable" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw { status: 401, message: "Mot de passe actuel incorrect" };

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });
  return { message: "Mot de passe mis à jour" };
};

// Supprimer son propre compte
export const deleteAccount = async (userId: string) => {
  // Cascade Prisma supprime tout (posts, tips, scams, follows, messages…)
  await prisma.user.delete({ where: { id: userId } });
};
