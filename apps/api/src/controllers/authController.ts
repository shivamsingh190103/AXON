import type { Request, Response } from 'express'
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from '@axon/shared'
import { env } from '../lib/env.js'
import { authService } from '../services/authService.js'
import { refreshCookieOptions } from '../services/tokenService.js'
import { ok, noContent } from '../utils/http.js'

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body)
    const result = await authService.register(input)

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    ok(res, result, 201)
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body)
    const result = await authService.login(input)

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    ok(res, result)
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.userId!, req.cookies.refreshToken)
    res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 })
    noContent(res)
  },

  async refresh(req: Request, res: Response) {
    const body = refreshSchema.parse(req.body ?? {})
    const token = req.cookies.refreshToken || body.refreshToken

    const result = await authService.refresh(token)

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    ok(res, result)
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.userId!)
    ok(res, user)
  },

  async forgotPassword(req: Request, res: Response) {
    const input = forgotPasswordSchema.parse(req.body)
    await authService.forgotPassword(input.email, env.FRONTEND_URL)
    ok(res, { message: 'If this email exists, a reset link has been sent.' })
  },

  async resetPassword(req: Request, res: Response) {
    const input = resetPasswordSchema.parse(req.body)
    await authService.resetPassword(input.token, input.newPassword)
    ok(res, { message: 'Password reset successful.' })
  },

  async googleCallback(req: Request, res: Response) {
    const profile = req.user as unknown as { googleId: string; email: string; name?: string; avatarUrl?: string }
    const result = await authService.upsertGoogleUser(profile)

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    const redirectUrl = `${env.FRONTEND_URL}/auth/success?accessToken=${encodeURIComponent(result.accessToken)}`
    res.redirect(redirectUrl)
  }
}
