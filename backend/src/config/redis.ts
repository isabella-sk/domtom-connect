import Redis from "ioredis";

export const redisClient = new Redis(process.env.REDIS_URL!, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redisClient.on("connect", () => console.log("Redis connecté"));
redisClient.on("error", (err) => console.error("Redis erreur:", err));
