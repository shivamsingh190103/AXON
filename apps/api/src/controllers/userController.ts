import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { changePasswordSchema, updateUserSchema } from '@axon/shared'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../lib/prisma.js'
import { analysisService } from '../services/analysisService.js'
import { ApiError } from '../utils/ApiError.js'
import { ok } from '../utils/http.js'
import { serializeUser } from '../utils/serializers.js'

export const userController = {
  async usage(req: Request, res: Response) {
    const usage = await analysisService.usage(req.userId!)
    ok(res, usage)
  },

  async updateMe(req: Request, res: Response) {
    const input = updateUserSchema.parse(req.body)

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {})
      }
    })

    ok(res, serializeUser(user))
  },

  async changePassword(req: Request, res: Response) {
    const input = changePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user || !user.passwordHash) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'PASSWORD_CHANGE_NOT_AVAILABLE', 'Password change is not available for this account')
    }

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash)
    if (!valid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Current password is incorrect')
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12)

    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash }
    })

    await prisma.refreshToken.deleteMany({ where: { userId: req.userId! } })

    ok(res, { message: 'Password updated successfully.' })
  }
}
