import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { User } from '@prisma/client'
import { env, isProd } from '../lib/env.js'

interface AccessTokenPayload {
  sub: string
  email: string
  type: 'access'
}

export function createAccessToken(user: User) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    type: 'access'
  }

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn']
  })
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex')
}

export function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
