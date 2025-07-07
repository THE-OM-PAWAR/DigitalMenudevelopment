import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, generateTokens, JWTPayload } from './jwt';

export interface AuthUser {
  userId: string;
  email: string;
  username: string;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (!accessToken) {
    return null;
  }

  const payload = verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
  };
}

export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  const { accessToken } = generateTokens({
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
  });

  return accessToken;
}