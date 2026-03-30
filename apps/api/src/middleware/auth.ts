import type { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { ApiError } from '../utils/ApiError.js'

interface JwtPayload {
  sub: string
  email: string
  type: 'access'
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication required'))
    return
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Invalid authentication token'))
      return
    }

    req.userId = user.id
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      analysesThisMonth: user.analysesThisMonth,
      monthResetAt: user.monthResetAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null
    }

    next()
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Invalid or expired token'))
  }
}
