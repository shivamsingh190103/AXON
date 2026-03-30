import { Router } from 'express'
import passport from 'passport'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { loginRateLimit } from '../middleware/rateLimit.js'
import { authController } from '../controllers/authController.js'
import { env } from '../lib/env.js'

const router = Router()
const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL)

router.post('/register', asyncHandler(authController.register))
router.post('/login', loginRateLimit, asyncHandler(authController.login))
router.post('/logout', requireAuth, asyncHandler(authController.logout))
router.post('/refresh', asyncHandler(authController.refresh))

router.get('/google', (req, res, next) => {
  if (!googleEnabled) {
    res.status(503).json({
      success: false,
      error: {
        code: 'GOOGLE_AUTH_DISABLED',
        message: 'Google OAuth is not configured.'
      }
    })
    return
  }

  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })(req, res, next)
})

router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) {
    res.status(503).json({
      success: false,
      error: {
        code: 'GOOGLE_AUTH_DISABLED',
        message: 'Google OAuth is not configured.'
      }
    })
    return
  }

  passport.authenticate('google', { session: false, failureRedirect: '/api/v1/auth/google-failed' })(req, res, next)
}, asyncHandler(authController.googleCallback))
router.get('/google-failed', (_req, res) => {
  res.status(401).json({
    success: false,
    error: {
      code: 'GOOGLE_AUTH_FAILED',
      message: 'Google authentication failed'
    }
  })
})

router.get('/me', requireAuth, asyncHandler(authController.me))
router.post('/forgot-password', asyncHandler(authController.forgotPassword))
router.post('/reset-password', asyncHandler(authController.resetPassword))

export default router
