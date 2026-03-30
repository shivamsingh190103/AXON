import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { Plan } from '@prisma/client'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { ApiError } from '../utils/ApiError.js'
import { nowPlus } from '../utils/time.js'
import { serializeUser } from '../utils/serializers.js'
import { createAccessToken, createRefreshToken, hashRefreshToken } from './tokenService.js'
import { sendPasswordResetEmail } from './emailService.js'

interface RegisterInput {
  email: string
  password: string
  name: string
}

interface LoginInput {
  email: string
  password: string
}

function makeResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function rotateRefreshToken(userId: string, currentHash?: string) {
  if (currentHash) {
    await prisma.refreshToken.deleteMany({ where: { token: currentHash, userId } })
  }

  const refreshToken = createRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenHash,
      userId,
      expiresAt: nowPlus(7)
    }
  })

  return refreshToken
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'EMAIL_EXISTS', 'Email already exists')
    }

    const passwordHash = await bcrypt.hash(input.password, 12)

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash,
        plan: Plan.FREE
      }
    })

    const accessToken = createAccessToken(user)
    const refreshToken = await rotateRefreshToken(user.id)

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken
    }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (!user || !user.passwordHash) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Invalid credentials')
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Invalid credentials')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const accessToken = createAccessToken(user)
    const refreshToken = await rotateRefreshToken(user.id)

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken
    }
  },

  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { userId } })
      return
    }

    await prisma.refreshToken.deleteMany({ where: { userId, token: hashRefreshToken(refreshToken) } })
  },

  async refresh(rawToken?: string) {
    if (!rawToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token')
    }

    const refreshTokenHash = hashRefreshToken(rawToken)
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenHash },
      include: { user: true }
    })

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN', 'Refresh token expired or invalid')
    }

    const newRefreshToken = await rotateRefreshToken(tokenRecord.userId, refreshTokenHash)
    const accessToken = createAccessToken(tokenRecord.user)

    return {
      user: serializeUser(tokenRecord.user),
      accessToken,
      refreshToken: newRefreshToken
    }
  },

  async forgotPassword(email: string, frontendUrl: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      return
    }

    const token = makeResetToken()
    await redis.set(`password_reset:${token}`, user.id, 'EX', 60 * 60)

    const resetUrl = `${frontendUrl}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, resetUrl)
  },

  async resetPassword(token: string, newPassword: string) {
    const userId = await redis.get(`password_reset:${token}`)

    if (!userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'RESET_TOKEN_EXPIRED', 'Reset token has expired or is invalid')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      }),
      prisma.refreshToken.deleteMany({ where: { userId } })
    ])

    await redis.del(`password_reset:${token}`)
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found')
    }

    return serializeUser(user)
  },

  async upsertGoogleUser(profile: { googleId: string; email: string; name?: string | null; avatarUrl?: string | null }) {
    const user = await prisma.user.upsert({
      where: { email: profile.email.toLowerCase() },
      create: {
        email: profile.email.toLowerCase(),
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        googleId: profile.googleId,
        plan: Plan.FREE,
        lastLoginAt: new Date()
      },
      update: {
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        lastLoginAt: new Date()
      }
    })

    const accessToken = createAccessToken(user)
    const refreshToken = await rotateRefreshToken(user.id)

    return {
      user: serializeUser(user),
      accessToken,
      refreshToken
    }
  }
}
