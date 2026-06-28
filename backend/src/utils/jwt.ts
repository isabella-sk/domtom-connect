import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

export interface TokenPayload {
  userId: string;
}

export const generateAccessToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES! as any,
  });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ userId, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES! as any,
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
